'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendiente de aceptar',
  CONFIRMED: 'Aceptada ✓',
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
        <div className="h-8 w-48 bg-[var(--muted)] rounded mb-6 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl h-32 mb-4 animate-pulse" />
        ))}
      </div>
    )
  }

  const active = bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'COMPLETED')
  const past   = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'COMPLETED')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-2">Mis solicitudes</h1>
      <p className="text-gray-400 text-sm mb-8">Las salas revisarán tus solicitudes y las aceptarán o rechazarán.</p>

      {bookings.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <div className="text-5xl mb-4">📨</div>
          <p className="text-lg font-medium mb-2">Sin solicitudes todavía</p>
          <p className="text-sm mb-6">Busca una sala de ensayo y haz tu primera solicitud</p>
          <button
            onClick={() => router.push('/search?type=venue')}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Ver salas
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Activas</h2>
              <div className="flex flex-col gap-4">
                {active.map(b => <BookingCard key={b.id} b={b} onCancel={cancel} cancelling={cancelling} router={router} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Historial</h2>
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
    <div className={`bg-[var(--card)] border rounded-2xl p-5 flex flex-col sm:flex-row gap-4 ${b.status === 'CONFIRMED' ? 'border-green-500/30' : 'border-[var(--border)]'}`}>
      <div className="w-14 h-14 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center text-2xl shrink-0">
        🏠
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="font-semibold truncate">{b.venue?.profile?.displayName || 'Sala'}</h3>
            <p className="text-xs text-gray-500">{b.venue?.profile?.city}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${STATUS_STYLES[b.status]}`}>
            {STATUS_LABELS[b.status]}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-2">{STATUS_DESC[b.status]}</p>

        <p className="text-sm text-gray-300 mb-0.5">📅 {formatDate(b.startTime)}</p>
        <p className="text-sm text-gray-300 mb-3">🕐 {formatTime(b.startTime)} – {formatTime(b.endTime)} · {hours}h</p>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm">
            <span className="font-semibold">{parseFloat(b.totalPrice).toFixed(2)}€</span>
            <span className="text-gray-500 text-xs ml-1">(incl. {parseFloat(b.platformFee).toFixed(2)}€ gestión)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/messages')}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Mensajear sala
            </button>
            {canCancel && (
              <button
                onClick={() => onCancel(b.id)}
                disabled={cancelling === b.id}
                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                {cancelling === b.id ? 'Retirando...' : 'Retirar solicitud'}
              </button>
            )}
          </div>
        </div>

        {b.notes && <p className="text-xs text-gray-600 mt-2 italic">"{b.notes}"</p>}
      </div>
    </div>
  )
}
