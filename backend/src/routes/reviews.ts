import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const CreateReviewSchema = z.object({
  profileId: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
})

export default async function reviewRoutes(server: FastifyInstance) {
  server.get('/profile/:profileId', async (request) => {
    const { profileId } = request.params as { profileId: string }
    return server.prisma.review.findMany({
      where: { profileId },
      include: {
        reviewer: {
          include: {
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const parsed = CreateReviewSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid data' })

    const { profileId, rating, body } = parsed.data
    const profile = await server.prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })
    if (profile.userId === userId) return reply.code(400).send({ error: 'Cannot review yourself' })

    return server.prisma.review.upsert({
      where: { reviewerId_profileId: { reviewerId: userId, profileId } },
      create: { reviewerId: userId, profileId, rating, body },
      update: { rating, body, updatedAt: new Date() },
    })
  })
}
