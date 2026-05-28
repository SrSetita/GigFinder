'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Guitar, Mic2, Building2, Megaphone, AlertCircle, Music4 } from 'lucide-react'
import { api } from '@/lib/api'
import { setSession } from '@/lib/auth'
import { useAuth } from '@/lib/AuthContext'
import MeshBackground from '@/components/ui/MeshBackground'
import GlassCard from '@/components/ui/GlassCard'

const ROLES = [
  { value: 'MUSICIAN',  label: 'Músico',     desc: 'Toco en solitario o busco banda',          icon: Guitar },
  { value: 'BAND',      label: 'Banda',       desc: 'Somos un grupo y queremos gigar',           icon: Mic2 },
  { value: 'VENUE',     label: 'Sala / Local', desc: 'Tengo un espacio para ensayar o actuar',  icon: Building2 },
  { value: 'PROMOTER',  label: 'Promotor',    desc: 'Organizo eventos y busco artistas',         icon: Megaphone },
]

function RegisterForm() {
  const router = useRouter()
  const { setUser } = useAuth()
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
      setUser(res.user)
      window.location.href = '/settings/profile?welcome=1'
    } catch (err: any) {
      const msg = err instanceof TypeError
        ? 'No se pudo conectar con el servidor'
        : (err?.error || 'Error al registrarse. Inténtalo de nuevo.')
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-8 glass-blur">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-6 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-3">Soy...</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    form.role === r.value
                      ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10'
                      : 'border-[var(--border)] hover:border-[var(--accent)]/30 bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon size={14} className={form.role === r.value ? 'text-[var(--accent)]' : 'text-gray-400'} />
                    <span className="font-medium text-sm">{r.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                </button>
              )
            })}
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
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
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
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
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
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
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
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-glow py-3 rounded-xl font-semibold mt-2 disabled:opacity-50 disabled:transform-none"
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
    </GlassCard>
  )
}

export default function RegisterPage() {
  return (
    <MeshBackground className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
            <Music4 size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Únete a GigFinder</h1>
          <p className="text-gray-400 text-sm">Crea tu cuenta y empieza a conectar</p>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </MeshBackground>
  )
}
