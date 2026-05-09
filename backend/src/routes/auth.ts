import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Role } from '@prisma/client'

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

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body)
    if (!body.success) return reply.code(400).send({ error: body.error.flatten() })

    const { email, password, role, displayName, city } = body.data

    const existing = await server.prisma.user.findUnique({ where: { email } })
    if (existing) return reply.code(409).send({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await server.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: { displayName, city },
        },
      },
      include: { profile: true },
    })

    const token = server.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    return reply.code(201).send({ token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } })
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
    return { token, user: { id: user.id, email: user.email, role: user.role, profile: user.profile } }
  })
}
