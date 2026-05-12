'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/ui/GlassCard'
import MeshBackground from '@/components/ui/MeshBackground'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/auth/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        try {
          const raw = localStorage.getItem('gf_user')
          if (raw) {
            const stored = JSON.parse(raw)
            const updated = { ...stored, emailVerified: true }
            localStorage.setItem('gf_user', JSON.stringify(updated))
            setUser(updated)
          }
        } catch {}
        setStatus('ok')
      })
      .catch(() => setStatus('error'))
  }, [searchParams])

  return (
    <div className="max-w-md mx-auto px-6 py-32 text-center">
      {status === 'loading' && (
        <>
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400">Verificando tu email...</p>
        </>
      )}
      {status === 'ok' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Email verificado!</h1>
          <p className="text-gray-400 mb-8">Tu cuenta está activa. Ya puedes reservar salas y enviar mensajes.</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary-glow px-6 py-2.5 rounded-lg font-medium"
          >
            Ir a inicio
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <XCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Enlace inválido</h1>
          <p className="text-gray-400 mb-8">Este enlace de verificación no es válido o ya ha caducado.</p>
          <button
            onClick={() => router.push('/')}
            className="glass hover:border-[var(--accent)]/30 text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <MeshBackground className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </MeshBackground>
  )
}
