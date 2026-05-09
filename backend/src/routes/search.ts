import { FastifyInstance } from 'fastify'
import { Role } from '@prisma/client'

export default async function searchRoutes(server: FastifyInstance) {
  server.get('/', async (request) => {
    const { q, type, city, genre, page = '1' } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 20

    const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined

    const where = {
      ...(textFilter && {
        OR: [
          { displayName: textFilter },
          { bio: textFilter },
          { city: textFilter },
        ],
      }),
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
      ...(genre && { genres: { has: genre } }),
      ...(type && { user: { role: type.toUpperCase() as Role } }),
    }

    const profiles = await server.prisma.profile.findMany({
      where,
      include: {
        user: { select: { role: true } },
        media: { where: { type: 'IMAGE' }, orderBy: { sortOrder: 'asc' }, take: 1 },
        musician: { select: { instruments: true, lookingForBand: true } },
        band: { select: { lookingForMembers: true } },
        venue: { select: { hourlyRate: true, amenities: true } },
        promoter: { select: { eventTypes: true } },
      },
      orderBy: [{ isPremium: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: 20,
    })

    return profiles
  })
}
