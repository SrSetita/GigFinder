import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio: z.string().max(1000).optional(),
  city: z.string().optional(),
  genres: z.array(z.string()).optional(),
  socialLinks: z.record(z.string()).optional(),
})

export default async function profileRoutes(server: FastifyInstance) {
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const profile = await server.prisma.profile.findUnique({
      where: { id },
      include: {
        user: { select: { role: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        musician: true,
        band: { include: { members: { include: { musician: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } } } } },
        venue: { include: { rooms: true } },
        promoter: true,
      },
    })

    if (!profile) return reply.code(404).send({ error: 'Profile not found' })
    return profile
  })

  server.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = updateProfileSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.update({
      where: { userId },
      data: body.data,
    })

    return profile
  })
}
