'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400',
  CONFIRMED: 'bg-green-500/10 text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-400',
  COMPLETED: 'bg-gray-500/10 text-gray-400',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', COMPLETED: 'Completada',
}

function pad(n: number) { return String(n).padStart(2, '0') }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

interface DaySchedule {
  dayOfWeek: number
  isOpen: boolean
  openHour: number
  closeHour: number
}

export default function VenueManagePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [venue, setVenue]         = useState<any>(null)
  const [schedule, setSchedule]   = useState<DaySchedule[]>([])
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'schedule' | 'bookings'>('schedule')

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/auth/login'); return }
    if (user.role !== 'VENUE') { router.push('/'); return }

    api.get<any>('/api/venues/my')
      .then(v => {
        setVenue(v)
        if (v.schedules?.length > 0) {
          setSchedule(v.schedules.map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            isOpen: s.isOpen,
            openHour: s.openHour,
            closeHour: s.closeHour,
          })))
        } else {
          // Default schedule
          setSchedule(Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isOpen: i < 6,
            openHour: 9,
            closeHour: 22,
          })))
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const updateDay = (dayOfWeek: number, changes: Partial<DaySchedule>) => {
    setSchedule(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, ...changes } : d))
    setSaved(false)
  }

  const saveSchedule = async () => {
    setSaving(true)
    try {
      await api.put('/api/venues/my/schedule', schedule)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const confirmBooking = async (bookingId: string) => {
    await api.patch(`/api/bookings/${bookingId}/confirm`, {})
    setVenue((prev: any) => ({
      ...prev,
      bookings: prev.bookings.map((b: any) =>
        b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b
      ),
    }))
  }

  const rejectBooking = async (bookingId: string) => {
    if (!confirm('¿Seguro que quieres rechazar esta solicitud?')) return
    await api.patch(`/api/bookings/${bookingId}/reject`, {})
    setVenue((prev: any) => ({
      ...prev,
      bookings: prev.bookings.map((b: any) =>
        b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
      ),
    }))
  }

  const messageRenter = async (renterId: string) => {
    await api.post('/api/messages/send', {
      recipientId: renterId,
      content: 'Hola, tengo una pregunta sobre tu solicitud.',
    })
    router.push('/messages')
  }

  if (authLoading || loading) {
    return <div className="max-w-3xl mx-auto px-6 py-10 text-gray-400">Cargando...</div>
  }

  const upcomingBookings = venue?.bookings ?? []
  const totalRevenue = upcomingBookings
    .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum: number, b: any) => sum + parseFloat(b.totalPrice) - parseFloat(b.platformFee), 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de gestión</h1>
        <p className="text-gray-400 text-sm mt-1">{venue?.profile?.displayName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-[var(--accent)]">{upcomingBookings.length}</p>
          <p className="text-sm text-gray-400 mt-1">Próximas reservas</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-green-400">{totalRevenue.toFixed(0)}€</p>
          <p className="text-sm text-gray-400 mt-1">Ingresos confirmados</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold">{upcomingBookings.filter((b: any) => b.status === 'PENDING').length}</p>
          <p className="text-sm text-gray-400 mt-1">Pendientes de confirmar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {(['schedule', 'bookings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-[var(--accent)] text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t === 'schedule' ? '🗓 Horario' : `📨 Solicitudes${upcomingBookings.filter((b:any)=>b.status==='PENDING').length > 0 ? ` (${upcomingBookings.filter((b:any)=>b.status==='PENDING').length} pendientes)` : ` (${upcomingBookings.length})`}`}
          </button>
        ))}
      </div>

      {/* Schedule editor */}
      {tab === 'schedule' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold">Horario semanal</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define en qué días y horas está disponible tu sala</p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {schedule.map(day => (
              <div key={day.dayOfWeek} className={`flex items-center gap-4 px-6 py-4 ${!day.isOpen ? 'opacity-50' : ''}`}>
                {/* Toggle */}
                <button
                  onClick={() => updateDay(day.dayOfWeek, { isOpen: !day.isOpen })}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${day.isOpen ? 'bg-[var(--accent)]' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${day.isOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>

                {/* Day name */}
                <span className="w-24 text-sm font-medium">{DAY_NAMES[day.dayOfWeek]}</span>

                {/* Hours */}
                {day.isOpen ? (
                  <div className="flex items-center gap-3 text-sm flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-gray-400 text-xs">Abre</label>
                      <select
                        value={day.openHour}
                        onChange={e => updateDay(day.dayOfWeek, { openHour: parseInt(e.target.value) })}
                        className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{pad(h)}:00</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-gray-600">—</span>
                    <div className="flex items-center gap-2">
                      <label className="text-gray-400 text-xs">Cierra</label>
                      <select
                        value={day.closeHour}
                        onChange={e => updateDay(day.dayOfWeek, { closeHour: parseInt(e.target.value) })}
                        className="bg-[var(--muted)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                      >
                        {Array.from({ length: 24 }, (_, h) => h + 1).map(h => (
                          <option key={h} value={h} disabled={h <= day.openHour}>{pad(h)}:00</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-gray-500 text-xs ml-2">
                      ({day.closeHour - day.openHour}h disponibles)
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-600 text-sm">Cerrado</span>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center gap-3">
            <button
              onClick={saveSchedule}
              disabled={saving}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar horario'}
            </button>
            {saved && <span className="text-green-400 text-sm">✓ Guardado</span>}
          </div>
        </div>
      )}

      {/* Solicitudes */}
      {tab === 'bookings' && (
        <div className="flex flex-col gap-3">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📨</div>
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            upcomingBookings.map((b: any) => {
              const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000
              const isPending = b.status === 'PENDING'
              return (
                <div
                  key={b.id}
                  className={`bg-[var(--card)] border rounded-2xl p-5 ${isPending ? 'border-yellow-500/30' : 'border-[var(--border)]'}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {b.renter?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <p className="font-semibold">{b.renter?.profile?.displayName}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">
                        📅 {fmtDate(b.startTime)} · {fmtTime(b.startTime)} – {fmtTime(b.endTime)} ({hours}h)
                      </p>
                      <p className="text-sm font-medium text-green-400 mt-1">
                        {(parseFloat(b.totalPrice) - parseFloat(b.platformFee)).toFixed(2)}€ netos
                        <span className="text-gray-500 font-normal text-xs ml-1">(cobran {parseFloat(b.totalPrice).toFixed(2)}€)</span>
                      </p>
                      {b.notes && (
                        <p className="text-xs text-gray-400 mt-1.5 bg-[var(--muted)] rounded-lg px-3 py-1.5 italic">
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                      <button
                        onClick={() => confirmBooking(b.id)}
                        className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        ✓ Aceptar
                      </button>
                      <button
                        onClick={() => messageRenter(b.renter.id)}
                        className="flex-1 bg-[var(--muted)] hover:bg-[var(--accent)]/10 border border-[var(--border)] hover:border-[var(--accent)] py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        💬 Preguntar
                      </button>
                      <button
                        onClick={() => rejectBooking(b.id)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        ✕ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
