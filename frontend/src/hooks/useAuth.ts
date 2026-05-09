'use client'

import { useState, useEffect } from 'react'
import { AuthUser, getUser, clearSession } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getUser())
    setLoading(false)
  }, [])

  const logout = () => {
    clearSession()
    setUser(null)
    window.location.href = '/'
  }

  return { user, loading, logout }
}
