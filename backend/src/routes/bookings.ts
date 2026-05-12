import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const PLATFORM_FEE_RATE = 0.10

const createBookingSchema = z.object({
  venueId: z.string(),
  roomId: z.string().optional(),
  bandId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
})

async function getVenueOwnerUserId(server: FastifyInstance, venueId: string): Promise<string | null> {
  const venue = await server.prisma.venue.findUnique({
    where: { id: venueId },
    include: { profile: { select: { userId: true } } },
  })
  return venue?.profile.userId ?? null
}

export default async function bookingRoutes(server: FastifyInstance) {
  // Create a booking request (always starts as PENDING)
  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user

    const caller = await server.prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } })
    if (!caller?.emailVerifiedAt) return reply.code(403).send({ error: 'EMAIL_NOT_VERIFIED' })

    const body = createBookingSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { venueId, roomId, bandId, startTime, endTime, notes } = body.data
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) return reply.code(400).send({ error: 'End time must be after start time' })

    if (bandId) {
      const membership = await server.prisma.bandMember.findFirst({
        where: { bandId, userId, status: 'ACTIVE' },
      })
      if (!membership) return reply.code(403).send({ error: 'No eres miembro activo de esa banda' })
    }

    const conflict = await server.prisma.booking.findFirst({
      where: {
        venueId,
        ...(roomId && { roomId }),
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
      },
    })
    if (conflict) return reply.code(409).send({ error: 'That time slot already has a pending or confirmed request' })

    const target = roomId
      ? await server.prisma.room.findUnique({ where: { id: roomId } })
      : await server.prisma.venue.findUnique({ where: { id: venueId } })
    if (!target) return reply.code(404).send({ error: 'Venue or room not found' })

    const hours = (end.getTime() - start.getTime()) / 3600000
    const basePrice = parseFloat(target.hourlyRate.toString()) * hours
    const platformFee = basePrice * PLATFORM_FEE_RATE

    const booking = await server.prisma.booking.create({
      data: {
        venueId, roomId, bandId,
        renterId: userId,
        startTime: start, endTime: end,
        totalPrice: basePrice + platformFee,
        platformFee, notes,
        status: 'PENDING',
      },
    })

    return reply.code(201).send(booking)
  })

  // Renter: list own requests/bookings
  server.get('/my', { preHandler: authenticate }, async (request) => {
    const { userId } = request.user

    return server.prisma.booking.findMany({
      where: { renterId: userId },
      include: {
        venue: { include: { profile: { select: { displayName: true, avatarUrl: true, city: true } } } },
        room: true,
        band: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { startTime: 'asc' },
    })
  })

  // Renter: cancel own request (only if still PENDING)
  server.patch('/:id/cancel', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }

    const booking = await server.prisma.booking.findUnique({ where: { id } })
    if (!booking) return reply.code(404).send({ error: 'Booking not found' })
    if (booking.renterId !== userId) return reply.code(403).send({ error: 'Not your booking' })
    if (booking.status === 'CANCELLED') return reply.code(400).send({ error: 'Already cancelled' })

    return server.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
  })

  // Venue: confirm a request
  server.patch('/:id/confirm', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts can confirm requests' })

    const { id } = request.params as { id: string }
    const booking = await server.prisma.booking.findUnique({ where: { id } })
    if (!booking) return reply.code(404).send({ error: 'Booking not found' })

    const ownerUserId = await getVenueOwnerUserId(server, booking.venueId)
    if (ownerUserId !== userId) return reply.code(403).send({ error: 'Not your venue' })
    if (booking.status !== 'PENDING') return reply.code(400).send({ error: `Cannot confirm a ${booking.status.toLowerCase()} request` })

    return server.prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED' } })
  })

  // Venue: reject a request
  server.patch('/:id/reject', { preHandler: authenticate }, async (request, reply) => {
    const { userId, role } = request.user
    if (role !== 'VENUE') return reply.code(403).send({ error: 'Only venue accounts can reject requests' })

    const { id } = request.params as { id: string }
    const booking = await server.prisma.booking.findUnique({ where: { id } })
    if (!booking) return reply.code(404).send({ error: 'Booking not found' })

    const ownerUserId = await getVenueOwnerUserId(server, booking.venueId)
    if (ownerUserId !== userId) return reply.code(403).send({ error: 'Not your venue' })
    if (booking.status !== 'PENDING') return reply.code(400).send({ error: `Cannot reject a ${booking.status.toLowerCase()} request` })

    return server.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
  })
}
