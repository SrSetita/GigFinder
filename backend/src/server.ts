import 'dotenv/config'
import path from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { Server as SocketServer } from 'socket.io'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

import authRoutes from './routes/auth'
import profileRoutes from './routes/profiles'
import venueRoutes from './routes/venues'
import bookingRoutes from './routes/bookings'
import messagingRoutes from './routes/messaging'
import searchRoutes from './routes/search'
import uploadRoutes from './routes/upload'
import notificationRoutes from './routes/notifications'
import reviewRoutes from './routes/reviews'
import gigOfferRoutes from './routes/gig-offers'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    io: SocketServer
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const server = Fastify({ logger: true })

server.decorate('prisma', prisma)

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
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
server.register(searchRoutes,       { prefix: '/api/search' })
server.register(uploadRoutes,       { prefix: '/api/upload' })
server.register(notificationRoutes, { prefix: '/api/notifications' })
server.register(reviewRoutes,       { prefix: '/api/reviews' })
server.register(gigOfferRoutes,     { prefix: '/api/gig-offers' })

server.get('/api/health', async () => ({ status: 'ok' }))

// Create Socket.io server and decorate before start() so Fastify allows it
const io = new SocketServer(server.server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const allowed = (allowedOrigins as (string | RegExp)[]).some(a =>
        typeof a === 'string' ? a === origin : a.test(origin)
      )
      callback(allowed ? null : new Error('Not allowed by CORS'), allowed)
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
})

server.decorate('io', io)

// JWT middleware runs after plugins are ready
server.addHook('onReady', async () => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    try {
      const decoded = server.jwt.verify<{ userId: string }>(token)
      socket.data.userId = decoded.userId
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join_conversation', async (conversationId: string) => {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId: socket.data.userId } },
      })
      if (participant) socket.join(conversationId)
    })

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(conversationId)
    })
  })
})

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
