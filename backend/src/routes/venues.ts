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
      orderBy: [{ profile: { isPremium: 'desc' } }, { createdAt: 'desc' }],
      skip,
      take: 20,
    } as any)

    return venues
  })

  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const venue = await server.prisma.venue.findUnique({
      where: { id },
      include: {
        profile: { include: { media: true } },
        rooms: true,
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
      data: { profileId: profile.id, ...body.data },
    })

    return reply.code(201).send(venue)
  })

  server.get('/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string }
    const query = availabilitySchema.safeParse(request.query)
    if (!query.success) return reply.code(400).send({ error: query.error.flatten() })

    const { date, roomId } = query.data
    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd = new Date(`${date}T23:59:59`)

    const bookings = await server.prisma.booking.findMany({
      where: {
        venueId: id,
        ...(roomId && { roomId }),
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: { startTime: true, endTime: true, roomId: true },
    })

    return { date, bookings }
  })
}
