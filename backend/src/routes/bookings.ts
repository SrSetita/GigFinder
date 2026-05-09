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

export default async function bookingRoutes(server: FastifyInstance) {
  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = createBookingSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { venueId, roomId, bandId, startTime, endTime, notes } = body.data
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) return reply.code(400).send({ error: 'End time must be after start time' })

    const conflict = await server.prisma.booking.findFirst({
      where: {
        venueId,
        ...(roomId && { roomId }),
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    })

    if (conflict) return reply.code(409).send({ error: 'Time slot already booked' })

    const target = roomId
      ? await server.prisma.room.findUnique({ where: { id: roomId } })
      : await server.prisma.venue.findUnique({ where: { id: venueId } })

    if (!target) return reply.code(404).send({ error: 'Venue or room not found' })

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const basePrice = parseFloat(target.hourlyRate.toString()) * hours
    const platformFee = basePrice * PLATFORM_FEE_RATE
    const totalPrice = basePrice + platformFee

    const booking = await server.prisma.booking.create({
      data: {
        venueId,
        roomId,
        bandId,
        renterId: userId,
        startTime: start,
        endTime: end,
        totalPrice,
        platformFee,
        notes,
      },
    })

    return reply.code(201).send(booking)
  })

  server.get('/my', { preHandler: authenticate }, async (request) => {
    const { userId } = request.user

    const bookings = await server.prisma.booking.findMany({
      where: { renterId: userId },
      include: {
        venue: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        room: true,
      },
      orderBy: { startTime: 'asc' },
    })

    return bookings
  })

  server.patch('/:id/cancel', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }

    const booking = await server.prisma.booking.findUnique({ where: { id } })
    if (!booking) return reply.code(404).send({ error: 'Booking not found' })
    if (booking.renterId !== userId) return reply.code(403).send({ error: 'Not your booking' })
    if (booking.status === 'CANCELLED') return reply.code(400).send({ error: 'Already cancelled' })

    const updated = await server.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return updated
  })
}
