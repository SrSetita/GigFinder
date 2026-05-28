'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, AlertTriangle, Music4 } from 'lucide-react'
import { api } from '@/lib/api'
import MeshBackground from '@/components/ui/MeshBackground'
import GlassCard from '@/components/ui/GlassCard'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ newPassword: '', confirm: '' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: form.newPassword })
      setDone(true)
    } catch (err: any) {
      setError(err?.error || 'El enlace ha expirado o no es válido')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <p className="text-[var(--text-secondary)] mb-4">Enlace inválido o expirado.</p>
        <Link href="/auth/forgot-password" className="text-[var(--accent)] hover:underline text-sm">
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={24} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Contraseña actualizada</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <Link
          href="/auth/login"
          className="btn-primary-glow px-6 py-3 rounded-xl font-semibold inline-block"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Nueva contraseña</h1>
      <p className="text-[var(--text-secondary)] mb-8 text-sm">Elige una contraseña de al menos 8 caracteres.</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-6 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-2">Nueva contraseña</label>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-2">Repetir contraseña</label>
          <input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary-glow py-3 rounded-xl font-semibold mt-2 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <MeshBackground className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center mb-4">
            <Music4 size={20} className="text-white" />
          </div>
        </div>
        <GlassCard className="p-8 glass-blur">
          <Suspense fallback={<div className="text-[var(--text-secondary)] text-center">Cargando...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </GlassCard>
      </div>
    </MeshBackground>
  )
}
