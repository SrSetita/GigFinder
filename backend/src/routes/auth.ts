import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { Role } from '../generated/prisma/client'
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email'

const RESEND_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes
const resendRateLimit = new Map<string, number>() // email → last sent timestamp

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  displayName: z.string().min(2).max(60),
  city: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function generateToken() {
  return randomBytes(32).toString('hex')
}

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { email, password, role, displayName, city } = body.data

    const existing = await server.prisma.user.findUnique({ where: { email } })
    if (existing) return reply.code(409).send({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = generateToken()

    let user: any
    try {
      user = await server.prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          verificationToken,
          profile: {
            create: { displayName, city },
          },
        },
        include: { profile: true },
      })
    } catch (err: any) {
      server.log.error({ err }, 'Registration user.create failed')
      return reply.code(500).send({ error: err?.message ?? 'Error al crear el usuario' })
    }

    if (role === 'BAND' && user.profile) {
      try {
        await server.prisma.band.create({
          data: {
            profileId: user.profile.id,
            name: displayName,
            city,
            members: {
              create: { userId: user.id, role: 'ADMIN', status: 'ACTIVE', joinedAt: new Date() },
            },
          },
        })
      } catch (err: any) {
        server.log.error({ err }, 'Registration band.create failed')
      }
    }

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(email, verificationToken).catch(() => {})

    const token = server.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    return reply.code(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: false,
        profile: user.profile,
      },
    })
  })

  server.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { email, password } = body.data

    const user = await server.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = server.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: !!user.emailVerifiedAt,
        profile: user.profile,
      },
    }
  })

  // Verify email via token from link
  server.get('/verify', async (request, reply) => {
    const { token } = request.query as { token?: string }
    if (!token) return reply.code(400).send({ error: 'Token required' })

    const user = await server.prisma.user.findUnique({ where: { verificationToken: token } })
    if (!user) return reply.code(400).send({ error: 'Invalid or expired token' })

    await server.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), verificationToken: null },
    })

    return { ok: true }
  })

  server.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as { email?: string }
    if (!email) return reply.code(400).send({ error: 'Email required' })

    const user = await server.prisma.user.findUnique({ where: { email } })
    if (user) {
      const resetToken = generateToken()
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await server.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry },
      })

      sendPasswordResetEmail(email, resetToken).catch(() => {})
    }

    return { ok: true }
  })

  server.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = request.body as { token?: string; newPassword?: string }

    if (!token || !newPassword || newPassword.length < 8) {
      return reply.code(400).send({ error: 'Se requiere token y contraseña de mínimo 8 caracteres' })
    }

    const user = await server.prisma.user.findUnique({ where: { passwordResetToken: token } })

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return reply.code(400).send({ error: 'El enlace ha expirado o no es válido' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await server.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
    })

    return { ok: true }
  })

  // Resend verification email
  server.post('/resend-verification', async (request, reply) => {
    const { email } = request.body as { email?: string }
    if (!email) return reply.code(400).send({ error: 'Email required' })

    const lastSent = resendRateLimit.get(email)
    if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      return reply.code(429).send({ error: 'Too many requests. Wait before requesting another email.' })
    }

    const user = await server.prisma.user.findUnique({ where: { email } })
    if (!user || user.emailVerifiedAt) return reply.code(200).send({ ok: true })

    const verificationToken = generateToken()
    await server.prisma.user.update({ where: { id: user.id }, data: { verificationToken } })

    resendRateLimit.set(email, Date.now())
    sendVerificationEmail(email, verificationToken).catch(() => {})
    return { ok: true }
  })
}
