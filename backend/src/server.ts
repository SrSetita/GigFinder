import 'dotenv/config'
import path from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

import authRoutes from './routes/auth'
import profileRoutes from './routes/profiles'
import venueRoutes from './routes/venues'
import bookingRoutes from './routes/bookings'
import messagingRoutes from './routes/messaging'
import searchRoutes from './routes/search'
import uploadRoutes from './routes/upload'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const server = Fastify({ logger: true })

server.decorate('prisma', prisma)

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // cualquier IP local de red doméstica
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
]

server.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
})

server.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 },
})

server.register(staticFiles, {
  root: path.join(__dirname, '../../public'),
  prefix: '/',
})

server.register(authRoutes,     { prefix: '/api/auth' })
server.register(profileRoutes,  { prefix: '/api/profiles' })
server.register(venueRoutes,    { prefix: '/api/venues' })
server.register(bookingRoutes,  { prefix: '/api/bookings' })
server.register(messagingRoutes,{ prefix: '/api/messages' })
server.register(searchRoutes,   { prefix: '/api/search' })
server.register(uploadRoutes,   { prefix: '/api/upload' })

server.get('/api/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 4000, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  await server.close()
})

start()
