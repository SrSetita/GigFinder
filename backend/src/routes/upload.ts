import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/auth'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'

const UPLOADS_DIR = path.join(__dirname, '../../public/uploads')
const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

async function storeFile(buffer: Buffer, mimetype: string, originalName: string): Promise<{ url: string; publicId: string }> {
  if (USE_CLOUDINARY) {
    return new Promise((resolve, reject) => {
      const isVideo = mimetype.startsWith('video/')
      cloudinary.uploader.upload_stream(
        { resource_type: isVideo ? 'video' : 'image', folder: 'gigfinder' },
        (err, result) => {
          if (err || !result) return reject(err)
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      ).end(buffer)
    })
  }

  // Local fallback
  const ext  = path.extname(originalName) || (mimetype.startsWith('video/') ? '.mp4' : '.jpg')
  const name = `${randomUUID()}${ext}`
  fs.writeFileSync(path.join(UPLOADS_DIR, name), buffer)
  const host = process.env.API_URL || 'http://localhost:4000'
  return { url: `${host}/uploads/${name}`, publicId: name }
}

export default async function uploadRoutes(server: FastifyInstance) {
  // Upload avatar
  server.post('/avatar', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file' })
    if (!data.mimetype.startsWith('image/')) return reply.code(400).send({ error: 'Only images allowed' })

    const buffer = await data.toBuffer()
    const { url } = await storeFile(buffer, data.mimetype, data.filename)

    const profile = await server.prisma.profile.update({
      where: { userId: request.user.userId },
      data: { avatarUrl: url },
    })
    return { url, profile }
  })

  // Upload banner
  server.post('/banner', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file' })
    if (!data.mimetype.startsWith('image/')) return reply.code(400).send({ error: 'Only images allowed' })

    const buffer = await data.toBuffer()
    const { url } = await storeFile(buffer, data.mimetype, data.filename)

    const profile = await server.prisma.profile.update({
      where: { userId: request.user.userId },
      data: { bannerUrl: url },
    })
    return { url, profile }
  })

  // Upload media (images or videos)
  server.post('/media', { preHandler: authenticate }, async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.code(400).send({ error: 'No file' })

    const isVideo = data.mimetype.startsWith('video/')
    const isImage = data.mimetype.startsWith('image/')
    if (!isVideo && !isImage) return reply.code(400).send({ error: 'Only images and videos allowed' })

    const buffer = await data.toBuffer()
    const { url, publicId } = await storeFile(buffer, data.mimetype, data.filename)

    const profile = await server.prisma.profile.findUnique({ where: { userId: request.user.userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const count = await server.prisma.media.count({ where: { profileId: profile.id } })

    const media = await server.prisma.media.create({
      data: {
        profileId: profile.id,
        type:      isVideo ? 'VIDEO' : 'IMAGE',
        url,
        publicId,
        sortOrder: count,
      },
    })
    return reply.code(201).send(media)
  })

  // Delete media
  server.delete('/media/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const profile = await server.prisma.profile.findUnique({ where: { userId: request.user.userId } })
    if (!profile) return reply.code(404).send({ error: 'Profile not found' })

    const media = await server.prisma.media.findUnique({ where: { id } })
    if (!media || media.profileId !== profile.id) return reply.code(403).send({ error: 'Not your media' })

    if (!USE_CLOUDINARY) {
      const filepath = path.join(UPLOADS_DIR, media.publicId)
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    }

    await server.prisma.media.delete({ where: { id } })
    return reply.code(204).send()
  })
}
