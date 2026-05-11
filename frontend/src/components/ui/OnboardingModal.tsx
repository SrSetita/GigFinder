'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Guitar, Mic2, Building2, Megaphone, X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const ROLES = [
  {
    value: 'MUSICIAN',
    label: 'Músico',
    desc: 'Busco banda, colaboraciones o directos',
    icon: Guitar,
    href: '/auth/register?role=MUSICIAN',
    color: 'blue',
  },
  {
    value: 'BAND',
    label: 'Banda',
    desc: 'Queremos gigar y encontrar músicos',
    icon: Mic2,
    href: '/auth/register?role=BAND',
    color: 'pink',
  },
  {
    value: 'VENUE',
    label: 'Sala / Local',
    desc: 'Tengo espacio y busco artistas',
    icon: Building2,
    href: '/auth/register?role=VENUE',
    color: 'purple',
  },
  {
    value: 'PROMOTER',
    label: 'Promotor',
    desc: 'Organizo eventos y necesito artistas',
    icon: Megaphone,
    href: '/auth/register?role=PROMOTER',
    color: 'orange',
  },
]

const COLOR_MAP: Record<string, string> = {
  blue:   'border-blue-500/40 bg-blue-500/10 text-blue-300',
  pink:   'border-pink-500/40 bg-pink-500/10 text-pink-300',
  purple: 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
}

const STORAGE_KEY = 'gf_onboarding_dismissed'

export default function OnboardingModal() {
  const { user, loading } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user) return
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [user, loading])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-lg border border-white/[0.15] rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: 'rgba(12,12,20,0.97)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">¿Quién eres?</h2>
          <p className="text-gray-400 text-sm">Crea tu cuenta según tu perfil y conecta con quien necesitas.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map(r => {
            const Icon = r.icon
            return (
              <Link
                key={r.value}
                href={r.href}
                onClick={dismiss}
                className={`border rounded-xl p-4 flex flex-col gap-2 hover:scale-[1.02] transition-all duration-200 ${COLOR_MAP[r.color]}`}
              >
                <Icon size={20} />
                <span className="font-semibold text-sm text-white">{r.label}</span>
                <span className="text-xs text-gray-400 leading-snug">{r.desc}</span>
                <ArrowRight size={12} className="mt-1 opacity-60" />
              </Link>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" onClick={dismiss} className="text-[var(--accent)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
