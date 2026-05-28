'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CalendarDays, Clock, Euro, MessageCircle, X, Search, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/ui/GlassCard'

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  COMPLETED: 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)]',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendiente de aceptar',
  CONFIRMED: 'Aceptada',
  CANCELLED: 'Rechazada / Cancelada',
  COMPLETED: 'Completada',
}

const STATUS_DESC: Record<string, string> = {
  PENDING:   'La sala revisará tu solicitud y te avisará.',
  CONFIRMED: 'La sala ha aceptado tu solicitud.',
  CANCELLED: 'Esta solicitud fue rechazada o cancelada.',
  COMPLETED: 'Ensayo completado.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    timeZone: 'UTC',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }
    api.get<any[]>('/api/bookings/my')
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const cancel = async (id: string) => {
    if (!confirm('¿Seguro que quieres retirar esta solicitud?')) return
    setCancelling(id)
    try {
      await api.patch(`/api/bookings/${id}/cancel`, {})
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    } finally {
      setCancelling(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="h-8 w-48 bg-white/[0.05] rounded mb-6 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl h-32 mb-4 animate-pulse" />
        ))}
      </div>
    )
  }

  const active = bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'COMPLETED')
  const past   = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'COMPLETED')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">Mis solicitudes</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">Las salas revisarán tus solicitudes y las aceptarán o rechazarán.</p>

      {bookings.length === 0 ? (
        <div className="text-center py-24 text-[var(--text-secondary)]">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-lg font-medium mb-2">Sin solicitudes todavía</p>
          <p className="text-sm mb-6 text-[var(--text-muted)]">Busca una sala de ensayo y haz tu primera solicitud</p>
          <button
            onClick={() => router.push('/search?type=venue')}
            className="inline-flex items-center gap-2 btn-primary-glow px-6 py-2.5 rounded-lg font-medium"
          >
            <Search size={16} />
            Ver salas
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Activas</h2>
              <div className="flex flex-col gap-4">
                {active.map(b => <BookingCard key={b.id} b={b} onCancel={cancel} cancelling={cancelling} router={router} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Historial</h2>
              <div className="flex flex-col gap-4">
                {past.map(b => <BookingCard key={b.id} b={b} onCancel={cancel} cancelling={cancelling} router={router} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function BookingCard({ b, onCancel, cancelling, router }: any) {
  const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000
  const canCancel = b.status === 'PENDING'

  return (
    <GlassCard className={`p-5 flex flex-col sm:flex-row gap-4 ${b.status === 'CONFIRMED' ? 'border-green-500/20' : ''}`}>
      <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
        <Building2 size={22} className="text-[var(--accent)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="font-semibold truncate">{b.venue?.profile?.displayName || 'Sala'}</h3>
            <p className="text-xs text-[var(--text-muted)]">{b.venue?.profile?.city}</p>
            {b.band && (
              <p className="flex items-center gap-1 text-xs text-[var(--accent)] mt-0.5">
                <Users size={10} />
                {b.band.name}
              </p>
            )}
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[b.status]}`}>
            {STATUS_LABELS[b.status]}
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-2">{STATUS_DESC[b.status]}</p>

        <p className="flex items-center gap-1.5 text-sm text-[var(--text-primary)] mb-0.5">
          <CalendarDays size={13} className="text-[var(--text-muted)]" />
          {formatDate(b.startTime)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-[var(--text-primary)] mb-3">
          <Clock size={13} className="text-[var(--text-muted)]" />
          {formatTime(b.startTime)} – {formatTime(b.endTime)} · {hours}h
        </p>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Euro size={13} className="text-[var(--text-secondary)]" />
            <span className="font-semibold">{parseFloat(b.totalPrice).toFixed(2)}</span>
            <span className="text-[var(--text-muted)] text-xs">(incl. {parseFloat(b.platformFee).toFixed(2)}€ gestión)</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/messages')}
              className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              <MessageCircle size={12} />
              Mensajear sala
            </button>
            {canCancel && (
              <button
                onClick={() => onCancel(b.id)}
                disabled={cancelling === b.id}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                <X size={12} />
                {cancelling === b.id ? 'Retirando...' : 'Retirar'}
              </button>
            )}
          </div>
        </div>

        {b.notes && <p className="text-xs text-[var(--text-muted)] mt-2 italic">"{b.notes}"</p>}
      </div>
    </GlassCard>
  )
}
