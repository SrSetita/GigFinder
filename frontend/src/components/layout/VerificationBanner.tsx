'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'

export default function VerificationBanner() {
  const { user, setUser } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (!user || user.emailVerified) return null

  const resend = async () => {
    setSending(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
      <span className="text-yellow-400">⚠️</span>
      <span className="text-yellow-300">
        Verifica tu email <span className="font-medium text-yellow-200">{user.email}</span> para poder reservar salas y enviar mensajes.
      </span>
      {sent ? (
        <span className="text-green-400 text-xs font-medium">✓ Email reenviado</span>
      ) : (
        <button
          onClick={resend}
          disabled={sending}
          className="text-yellow-400 hover:text-yellow-200 underline underline-offset-2 disabled:opacity-50 transition-colors text-xs"
        >
          {sending ? 'Enviando...' : 'Reenviar email'}
        </button>
      )}
    </div>
  )
}
