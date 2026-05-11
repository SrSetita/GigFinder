import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'

export default async function notificationRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: authenticate }, async (request) => {
    const { userId } = request.user
    return server.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  })

  server.patch('/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }
    const notif = await server.prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.userId !== userId) return reply.code(404).send({ error: 'Not found' })
    return server.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })
  })

  server.patch('/read-all', { preHandler: authenticate }, async (request) => {
    const { userId } = request.user
    await server.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
    return { ok: true }
  })
}
