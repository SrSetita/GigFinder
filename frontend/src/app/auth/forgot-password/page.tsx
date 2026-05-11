'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Mail, Music4, ArrowLeft } from 'lucide-react'
import { api } from '@/lib/api'
import MeshBackground from '@/components/ui/MeshBackground'
import GlassCard from '@/components/ui/GlassCard'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('No se pudo enviar el correo. Inténtalo de nuevo.')
    } finally {
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
        </div>

        <GlassCard className="p-8 glass-blur">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center mx-auto mb-5">
                <Mail size={24} className="text-[var(--accent)]" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Revisa tu email</h1>
              <p className="text-gray-400 text-sm mb-6">
                Si <span className="text-white font-medium">{email}</span> está registrado, recibirás un enlace para restablecer tu contraseña. Caduca en 1 hora.
              </p>
              <Link href="/auth/login" className="text-[var(--accent)] hover:underline text-sm flex items-center gap-1 justify-center">
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-400 mb-8 text-sm">
                Escribe tu email y te enviaremos un enlace para restablecerla.
              </p>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
                    placeholder="tu@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-glow py-3 rounded-xl font-semibold mt-2 disabled:opacity-50 disabled:transform-none"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                <Link href="/auth/login" className="text-[var(--accent)] hover:underline flex items-center gap-1 justify-center">
                  <ArrowLeft size={14} />
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </GlassCard>
      </div>
    </MeshBackground>
  )
}
