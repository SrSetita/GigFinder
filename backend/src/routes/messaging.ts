import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const sendMessageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1).max(2000),
})

export default async function messagingRoutes(server: FastifyInstance) {
  server.get('/conversations', { preHandler: authenticate }, async (request) => {
    const { userId } = request.user

    const conversations = await server.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: { user: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return conversations
  })

  server.get('/conversations/:id', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const { id } = request.params as { id: string }

    const conversation = await server.prisma.conversation.findFirst({
      where: { id, participants: { some: { userId } } },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    })

    if (!conversation) return reply.code(404).send({ error: 'Conversation not found' })

    await server.prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    })

    return conversation
  })

  server.post('/send', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = sendMessageSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { recipientId, content } = body.data

    let conversation = await server.prisma.conversation.findFirst({
      where: {
        participants: { every: { userId: { in: [userId, recipientId] } } },
      },
      include: { participants: true },
    })

    if (!conversation || conversation.participants.length !== 2) {
      conversation = await server.prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId }, { userId: recipientId }],
          },
        },
        include: { participants: true },
      })
    }

    const message = await server.prisma.message.create({
      data: { conversationId: conversation.id, senderId: userId, content },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    })

    await server.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    })

    return reply.code(201).send(message)
  })
}
