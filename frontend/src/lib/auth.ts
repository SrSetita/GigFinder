'use client'

export interface AuthUser {
  id: string
  email: string
  role: 'MUSICIAN' | 'BAND' | 'VENUE' | 'PROMOTER'
  emailVerified: boolean
  profile: {
    id: string
    displayName: string
    avatarUrl: string | null
    city: string
  }
}

export function getToken(): string | null {
  return localStorage.getItem('gf_token')
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem('gf_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSession(token: string, user: AuthUser) {
  localStorage.setItem('gf_token', token)
  localStorage.setItem('gf_user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('gf_token')
  localStorage.removeItem('gf_user')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
