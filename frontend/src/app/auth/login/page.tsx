'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Music4 } from 'lucide-react'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { useAuth } from '@/lib/AuthContext'
import MeshBackground from '@/components/ui/MeshBackground'
import GlassCard from '@/components/ui/GlassCard'

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
    <MeshBackground className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
            <Music4 size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Bienvenido de vuelta</h1>
          <p className="text-gray-400 text-sm">Entra en tu cuenta de GigFinder</p>
        </div>

        <GlassCard className="p-8 glass-blur">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-6 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
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
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
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
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-glow py-3 rounded-xl font-semibold mt-2 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" className="text-[var(--accent)] hover:underline">
                Regístrate
              </Link>
            </p>
            <Link href="/auth/forgot-password" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </GlassCard>
      </div>
    </MeshBackground>
  )
}
