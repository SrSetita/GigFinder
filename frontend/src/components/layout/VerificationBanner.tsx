'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

const COOLDOWN_SECONDS = 120
const LS_KEY = 'gf_verify_sent_at'

function getSecondsLeft(): number {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return 0
  const elapsed = Math.floor((Date.now() - parseInt(raw)) / 1000)
  return Math.max(0, COOLDOWN_SECONDS - elapsed)
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function VerificationBanner() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const s = getSecondsLeft()
    if (s > 0) setCooldown(s)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(id); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  if (!user || user.emailVerified) return null

  const resend = async () => {
    setSending(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/auth/resend-verification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        }
      )
      if (res.ok) {
        localStorage.setItem(LS_KEY, String(Date.now()))
        setSent(true)
        setCooldown(COOLDOWN_SECONDS)
        setTimeout(() => setSent(false), 4000)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
      <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
      <span className="text-yellow-300">
        Verifica tu email <span className="font-medium text-yellow-200">{user.email}</span> para reservar salas y enviar mensajes.
      </span>
      {sent ? (
        <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
          <CheckCircle2 size={12} />
          Email enviado, revisa tu bandeja
        </span>
      ) : cooldown > 0 ? (
        <span className="text-yellow-600 text-xs">Podrás reenviar en {fmt(cooldown)}</span>
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
