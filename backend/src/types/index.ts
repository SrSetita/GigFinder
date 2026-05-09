import { Role } from '@prisma/client'

export interface JWTPayload {
  userId: string
  email: string
  role: Role
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload
    user: JWTPayload
  }
}
