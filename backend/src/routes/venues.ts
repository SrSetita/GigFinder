import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const createVenueSchema = z.object({
  hourlyRate: z.number().positive(),
  capacity: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  address: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomId: z.string().optional(),
})

const scheduleSchema = z.array(z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
}))

const DEFAULT_SCHEDULE = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isOpen: i < 6, // Mon-Sat open, Sun closed
  openHour: 9,
  closeHour: 22,
}))

export default async function venueRoutes(server: FastifyInstance) {
  server.get('/', async (request) => {
    const { city, minRate, maxRate, page = '1' } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 20

    const venues = await server.prisma.venue.findMany({
      where: {
        ...(city && { profile: { city: { contains: city, mode: 'insensitive' } } }),
        ...(minRate && { hourlyRate: { gte: parseFloat(minRate) } }),
        ...(maxRate && { hourlyRate: { lte: parseFloat(maxRate) } }),
      },
      include: {
        profile: { select: { displayName: true, avatarUrl: true, city: true, genres: true, isPremium: true } },
        rooms: { take: 1 },
      },
      orderBy: [{ profile: { isPremium: 'desc' } }, { profile: { createdAt: 'desc' } }],
      skip,
      take: 20,
    } as any)

    return venues
  })

  server.get('/my', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts' })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const venue = await server.prisma.venue.findUnique({
      where: { profileId: profile.id },
      include: {
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            startTime: { gte: new Date() },
          },
          include: {
            renter: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
            room: true,
          },
          orderBy: { startTime: 'asc' },
          take: 50,
        },
      },
    })

    if (!venue) return reply.code(404).send({ error: 'Venue not found' })
    return venue
  })

  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const venue = await server.prisma.venue.findUnique({
      where: { id },
      include: {
        profile: { include: { media: true } },
        rooms: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
      },
    })

    if (!venue) return reply.code(404).send({ error: 'Venue not found' })
    return venue
  })

  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts can register venues' })

    const body = createVenueSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const venue = await server.prisma.venue.create({
      data: {
        profileId: profile.id,
        ...body.data,
        schedules: {
          createMany: { data: DEFAULT_SCHEDULE },
        },
      },
      include: { schedules: true },
    })

    return reply.code(201).send(venue)
  })

  // GET schedule for a venue
  server.get('/:id/schedule', async (request, reply) => {
    const { id } = request.params as { id: string }

    const schedules = await server.prisma.venueSchedule.findMany({
      where: { venueId: id },
      orderBy: { dayOfWeek: 'asc' },
    })

    // Return defaults if no schedule configured yet
    if (schedules.length === 0) return DEFAULT_SCHEDULE.map(s => ({ ...s, id: null, venueId: id }))
    return schedules
  })

  // PUT schedule (venue owner only)
  server.put('/my/schedule', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts' })

    const body = scheduleSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })
    const venue = await server.prisma.venue.findUnique({ where: { profileId: profile.id } })
    if (!venue) return reply.code(404).send({ error: 'Venue not found' })

    // Upsert each day
    const results = await Promise.all(
      body.data.map(day =>
        server.prisma.venueSchedule.upsert({
          where: { venueId_dayOfWeek: { venueId: venue.id, dayOfWeek: day.dayOfWeek } },
          create: { venueId: venue.id, ...day },
          update: { isOpen: day.isOpen, openHour: day.openHour, closeHour: day.closeHour },
        })
      )
    )

    return results
  })

  // GET availability for a specific date
  server.get('/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string }
    const query = availabilitySchema.safeParse(request.query)
    if (!query.success) return reply.code(400).send({ error: query.error.flatten() })

    const { date, roomId } = query.data
    const dayStart = new Date(`${date}T00:00:00Z`)
    const dayEnd   = new Date(`${date}T23:59:59Z`)

    // Day of week: 0=Mon … 6=Sun (match our schema convention)
    const jsDay = dayStart.getUTCDay() // 0=Sun, 1=Mon...
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1

    const [schedule, bookings] = await Promise.all([
      server.prisma.venueSchedule.findUnique({
        where: { venueId_dayOfWeek: { venueId: id, dayOfWeek } },
      }),
      server.prisma.booking.findMany({
        where: {
          venueId: id,
          ...(roomId && { roomId }),
          status: { in: ['PENDING', 'CONFIRMED'] },
          startTime: { gte: dayStart },
          endTime:   { lte: dayEnd },
        },
        select: { startTime: true, endTime: true, roomId: true },
      }),
    ])

    const daySchedule = schedule ?? { isOpen: dayOfWeek < 6, openHour: 9, closeHour: 22 }

    return {
      date,
      dayOfWeek,
      schedule: daySchedule,
      bookings: bookings.map(b => ({
        startHour: new Date(b.startTime).getUTCHours(),
        endHour:   new Date(b.endTime).getUTCHours(),
        roomId: b.roomId,
      })),
    }
  })

  // PATCH venue details (venue owner)
  server.patch('/my', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts' })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const allowedFields = ['hourlyRate', 'capacity', 'amenities', 'address']
    const data: Record<string, any> = {}
    const body = request.body as Record<string, any>
    for (const key of allowedFields) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const venue = await server.prisma.venue.update({
      where: { profileId: profile.id },
      data,
    })
    return venue
  })
}
