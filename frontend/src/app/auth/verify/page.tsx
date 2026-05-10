'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/verify?token=${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error()
        // Update stored user so banner disappears immediately
        if (user) {
          const updated = { ...user, emailVerified: true }
          localStorage.setItem('gf_user', JSON.stringify(updated))
          setUser(updated)
        }
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
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-bold mb-2">¡Email verificado!</h1>
          <p className="text-gray-400 mb-8">Tu cuenta está activa. Ya puedes reservar salas y enviar mensajes.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Ir a inicio
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-5xl mb-6">❌</div>
          <h1 className="text-2xl font-bold mb-2">Enlace inválido</h1>
          <p className="text-gray-400 mb-8">Este enlace de verificación no es válido o ya ha caducado.</p>
          <button
            onClick={() => router.push('/')}
            className="border border-[var(--border)] hover:border-[var(--accent)] text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </>
      )}
    </div>
  )
}
