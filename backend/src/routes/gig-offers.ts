import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const CreateOfferSchema = z.object({
  title:       z.string().min(5).max(120),
  description: z.string().max(2000).optional(),
  city:        z.string().min(2),
  date:        z.string().datetime().optional(),
  budget:      z.number().positive().optional(),
  genres:      z.array(z.string()).default([]),
  offerType:   z.enum(['venue_needed', 'musician_needed', 'band_needed', 'promoter_needed']),
})

export default async function gigOfferRoutes(server: FastifyInstance) {
  server.get('/', async (request) => {
    const { offerType, city, page = '1' } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 20

    return server.prisma.gigOffer.findMany({
      where: {
        isActive: true,
        ...(offerType && { offerType }),
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      },
      include: {
        author: {
          include: {
            profile: { select: { id: true, displayName: true, avatarUrl: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: 20,
    })
  })

  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const offer = await server.prisma.gigOffer.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            profile: { select: { id: true, displayName: true, avatarUrl: true, city: true } },
          },
        },
      },
    })
    if (!offer) return reply.code(404).send({ error: 'Not found' })
    return offer
  })

  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const parsed = CreateOfferSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid data', details: parsed.error.flatten() })

    const { date, budget, ...rest } = parsed.data
    return server.prisma.gigOffer.create({
      data: {
        ...rest,
        authorId: userId,
        ...(date   && { date:   new Date(date) }),
        ...(budget && { budget: budget }),
      },
    })
  })

  server.patch('/:id/toggle', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }
    const offer = await server.prisma.gigOffer.findUnique({ where: { id } })
    if (!offer) return reply.code(404).send({ error: 'Not found' })
    if (offer.authorId !== userId) return reply.code(403).send({ error: 'Forbidden' })
    return server.prisma.gigOffer.update({
      where: { id },
      data: { isActive: !offer.isActive },
    })
  })

  server.delete('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }
    const offer = await server.prisma.gigOffer.findUnique({ where: { id } })
    if (!offer) return reply.code(404).send({ error: 'Not found' })
    if (offer.authorId !== userId) return reply.code(403).send({ error: 'Forbidden' })
    await server.prisma.gigOffer.delete({ where: { id } })
    return { ok: true }
  })
}
