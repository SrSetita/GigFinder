'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { useAuth } from '@/lib/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: any }>('/api/auth/login', form)
      setSession(res.token, res.user)
      setUser(res.user)
      window.location.href = '/'
    } catch (err: any) {
      const msg = err instanceof TypeError
        ? 'No se pudo conectar con el servidor'
        : (err?.error || 'Email o contraseña incorrectos')
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">Bienvenido de vuelta</h1>
          <p className="text-gray-400 mb-8 text-sm">Entra en tu cuenta de GigFinder</p>

          {error && (
            <div className="bg-red-600 text-white rounded-lg p-3 mb-6 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Contraseña</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-[var(--accent)] hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
