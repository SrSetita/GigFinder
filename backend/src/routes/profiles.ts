import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio:         z.string().max(1000).optional(),
  city:        z.string().min(2).optional(),
  genres:      z.array(z.string()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
})

const updateMusicianSchema = z.object({
  instruments:    z.array(z.string()).optional(),
  yearsExperience:z.number().int().min(0).optional(),
  lookingForBand: z.boolean().optional(),
  openToCollabs:  z.boolean().optional(),
})

const updateBandSchema = z.object({
  lookingForMembers: z.boolean().optional(),
  wantedRoles:       z.array(z.string()).optional(),
})

const updatePromoterSchema = z.object({
  eventTypes: z.array(z.string()).optional(),
  website:    z.string().url().optional().or(z.literal('')),
})

export default async function profileRoutes(server: FastifyInstance) {
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const profile = await server.prisma.profile.findUnique({
      where: { id },
      include: {
        user:    { select: { role: true } },
        media:   { orderBy: { sortOrder: 'asc' } },
        musician: true,
        band:    { include: { members: { include: { musician: { include: { profile: { select: { displayName: true, avatarUrl: true } } } } } } } },
        venue:   { include: { rooms: true } },
        promoter: true,
      },
    })

    if (!profile) return reply.code(404).send({ error: 'Profile not found' })
    return profile
  })

  // Get own profile (for edit page)
  server.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const profile = await server.prisma.profile.findUnique({
      where: { userId },
      include: {
        user:     { select: { role: true } },
        media:    { orderBy: { sortOrder: 'asc' } },
        musician: true,
        band:     true,
        venue:    true,
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
      data: body.data as any,
    })
    return profile
  })

  server.patch('/me/musician', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = updateMusicianSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const musician = await server.prisma.musician.upsert({
      where:  { profileId: profile.id },
      create: { profileId: profile.id, instruments: [], ...body.data },
      update: body.data,
    })
    return musician
  })

  server.patch('/me/band', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = updateBandSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const band = await server.prisma.band.upsert({
      where:  { profileId: profile.id },
      create: { profileId: profile.id, wantedRoles: [], ...body.data },
      update: body.data,
    })
    return band
  })

  server.patch('/me/promoter', { preHandler: authenticate }, async (request, reply) => {
    const { userId } = request.user
    const body = updatePromoterSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const profile = await server.prisma.profile.findUnique({ where: { userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const promoter = await server.prisma.promoter.upsert({
      where:  { profileId: profile.id },
      create: { profileId: profile.id, eventTypes: [], ...body.data },
      update: body.data,
    })
    return promoter
  })
}
