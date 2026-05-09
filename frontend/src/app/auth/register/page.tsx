'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { Suspense } from 'react'

const ROLES = [
  { value: 'MUSICIAN', label: '🎸 Músico', desc: 'Toco en solitario o busco banda' },
  { value: 'BAND', label: '🎤 Banda', desc: 'Somos un grupo y queremos gigar' },
  { value: 'VENUE', label: '🏠 Sala / Local', desc: 'Tengo un espacio para ensayar o actuar' },
  { value: 'PROMOTER', label: '📣 Promotor', desc: 'Organizo eventos y busco artistas' },
]

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    city: '',
    role: params.get('role') || 'MUSICIAN',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: any }>('/api/auth/register', form)
      setSession(res.token, res.user)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2">Únete a GigFinder</h1>
          <p className="text-gray-400 mb-8 text-sm">Crea tu cuenta y empieza a conectar</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-3">Soy...</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      form.role === r.value
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{r.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {form.role === 'BAND' ? 'Nombre de la banda' : form.role === 'VENUE' ? 'Nombre del local' : 'Tu nombre artístico'}
              </label>
              <input
                type="text"
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Nombre público"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Ciudad</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Madrid, Barcelona, Valencia..."
              />
            </div>

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
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-colors mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-[var(--accent)] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
