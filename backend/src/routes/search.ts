import { FastifyInstance } from 'fastify'
import { Role } from '../generated/prisma/client'

export default async function searchRoutes(server: FastifyInstance) {
  server.get('/', async (request) => {
    const { q, type, city, genre, page = '1' } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * 20

    const textFilter = q ? { contains: q, mode: 'insensitive' as const } : undefined

    // Profile-based search (MUSICIAN, VENUE, PROMOTER, BAND accounts)
    const profileWhere = {
      isPublic: true,
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
      where: profileWhere,
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

    // Musician-owned bands — no Profile, stored directly in Band table
    // Only included when type=band or no type filter
    let musicianBands: any[] = []
    if (!type || type === 'band') {
      const bandWhere: any = {
        isPublic: true,
        ownerUserId: { not: null },
        profileId: null,
        ...(textFilter && {
          OR: [
            { name: textFilter },
            { description: textFilter },
            { city: textFilter },
          ],
        }),
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
        ...(genre && { genres: { has: genre } }),
      }

      const bands = await server.prisma.band.findMany({
        where: bandWhere,
        include: {
          members: { where: { status: 'ACTIVE' }, select: { userId: true, role: true } },
          media: { where: { type: 'IMAGE' }, orderBy: { sortOrder: 'asc' }, take: 1 },
        },
        orderBy: { members: { _count: 'desc' } },
        skip: type ? skip : 0,
        take: type ? 20 : 10,
      })

      // Normalize to a shape compatible with profile results
      musicianBands = bands.map(b => ({
        _type: 'musician_band',
        id: b.id,
        displayName: b.name,
        bio: b.description,
        city: b.city,
        avatarUrl: b.avatarUrl,
        bannerUrl: b.bannerUrl,
        genres: b.genres,
        media: b.media,
        memberCount: b.members.length,
        lookingForMembers: b.lookingForMembers,
      }))
    }

    return { profiles, musicianBands }
  })
}
