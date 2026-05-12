import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'

export default async function bandRoutes(server: FastifyInstance) {
  server.post('/api/bands', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { name, description, genres, city, avatarUrl } = req.body as any

    if (!name?.trim()) return reply.status(400).send({ error: 'name required' })

    const band = await server.prisma.band.create({
      data: {
        name,
        description,
        genres: genres ?? [],
        city,
        avatarUrl,
        ownerUserId: userId,
        members: {
          create: { userId, role: 'ADMIN', status: 'ACTIVE', joinedAt: new Date() },
        },
      },
      include: { members: { include: { user: { include: { profile: true } } } } },
    })
    return reply.status(201).send(band)
  })

  server.get('/api/bands/mine', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const bands = await server.prisma.band.findMany({
      where: { members: { some: { userId, status: 'ACTIVE' } } },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: { user: { include: { profile: true } } },
        },
      },
    })
    return reply.send(bands)
  })

  server.get('/api/bands/invitations', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const invites = await server.prisma.bandMember.findMany({
      where: { userId, status: 'PENDING' },
      include: {
        band: {
          include: {
            members: { where: { status: 'ACTIVE' }, include: { user: { include: { profile: true } } } },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    })
    return reply.send(invites)
  })

  server.get('/api/bands/:id', async (req, reply) => {
    const { id } = req.params as any
    const band = await server.prisma.band.findUnique({
      where: { id },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: { user: { include: { profile: true } } },
        },
        media: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!band) return reply.status(404).send({ error: 'not found' })
    return reply.send(band)
  })

  server.patch('/api/bands/:id', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any
    const { name, description, genres, city, avatarUrl, bannerUrl, socialLinks, isPublic, lookingForMembers, wantedRoles } = req.body as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.role !== 'ADMIN') return reply.status(403).send({ error: 'forbidden' })

    const band = await server.prisma.band.update({
      where: { id },
      data: { name, description, genres, city, avatarUrl, bannerUrl, socialLinks, isPublic, lookingForMembers, wantedRoles },
      include: {
        members: { where: { status: 'ACTIVE' }, include: { user: { include: { profile: true } } } },
        media: { orderBy: { sortOrder: 'asc' } },
      },
    })
    return reply.send(band)
  })

  server.delete('/api/bands/:id', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.role !== 'ADMIN') return reply.status(403).send({ error: 'forbidden' })

    await server.prisma.band.delete({ where: { id } })
    return reply.status(204).send()
  })

  server.post('/api/bands/:id/invite', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any
    const { email } = req.body as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.role !== 'ADMIN') return reply.status(403).send({ error: 'forbidden' })

    const target = await server.prisma.user.findUnique({ where: { email } })
    if (!target) return reply.status(404).send({ error: 'user not found' })
    if (target.id === userId) return reply.status(400).send({ error: 'cannot invite yourself' })

    const existing = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId: target.id } },
    })
    if (existing) return reply.status(400).send({ error: 'already member or invited' })

    await server.prisma.bandMember.create({
      data: { bandId: id, userId: target.id, role: 'MEMBER', status: 'PENDING' },
    })

    const band = await server.prisma.band.findUnique({ where: { id } })
    await server.prisma.notification.create({
      data: {
        userId: target.id,
        type: 'BAND_INVITE',
        title: 'Invitación a banda',
        body: `Te han invitado a unirte a ${band?.name ?? 'una banda'}`,
        link: '/dashboard',
      },
    })
    return reply.status(201).send({ ok: true })
  })

  server.post('/api/bands/:id/accept', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.status !== 'PENDING') return reply.status(400).send({ error: 'no pending invitation' })

    await server.prisma.bandMember.update({
      where: { bandId_userId: { bandId: id, userId } },
      data: { status: 'ACTIVE', joinedAt: new Date() },
    })
    return reply.send({ ok: true })
  })

  server.post('/api/bands/:id/decline', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any

    await server.prisma.bandMember.deleteMany({
      where: { bandId: id, userId, status: 'PENDING' },
    })
    return reply.send({ ok: true })
  })

  server.delete('/api/bands/:id/members/:targetUserId', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id, targetUserId } = req.params as any

    if (targetUserId === userId) return reply.status(400).send({ error: 'use leave instead' })

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.role !== 'ADMIN') return reply.status(403).send({ error: 'forbidden' })

    await server.prisma.bandMember.delete({
      where: { bandId_userId: { bandId: id, userId: targetUserId } },
    })
    return reply.status(204).send()
  })

  server.post('/api/bands/:id/leave', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id } = req.params as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership) return reply.status(404).send({ error: 'not a member' })

    if (membership.role === 'ADMIN') {
      const otherAdmins = await server.prisma.bandMember.count({
        where: { bandId: id, role: 'ADMIN', status: 'ACTIVE', userId: { not: userId } },
      })
      if (otherAdmins === 0) return reply.status(400).send({ error: 'assign another admin before leaving' })
    }

    await server.prisma.bandMember.delete({ where: { bandId_userId: { bandId: id, userId } } })
    return reply.send({ ok: true })
  })

  server.patch('/api/bands/:id/members/:targetUserId/role', { preHandler: authenticate }, async (req, reply) => {
    const { userId } = req.user
    const { id, targetUserId } = req.params as any
    const { role } = req.body as any

    const membership = await server.prisma.bandMember.findUnique({
      where: { bandId_userId: { bandId: id, userId } },
    })
    if (!membership || membership.role !== 'ADMIN') return reply.status(403).send({ error: 'forbidden' })

    await server.prisma.bandMember.update({
      where: { bandId_userId: { bandId: id, userId: targetUserId } },
      data: { role },
    })
    return reply.send({ ok: true })
  })
}
