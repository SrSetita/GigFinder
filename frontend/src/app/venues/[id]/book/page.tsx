'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Calendar from '@/components/booking/Calendar'

const PLATFORM_FEE = 0.10

function pad(n: number) { return String(n).padStart(2, '0') }

export default function BookVenuePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [venue, setVenue]           = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [selectedStart, setSelectedStart] = useState<number | null>(null)
  const [duration, setDuration]     = useState(2)
  const [notes, setNotes]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)

  useEffect(() => {
    api.get<any>(`/api/venues/${id}`)
      .then(setVenue)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!selectedDate) return
    setAvailability(null)
    setSelectedStart(null)
    api.get<any>(`/api/venues/${id}/availability?date=${selectedDate}`)
      .then(setAvailability)
  }, [selectedDate, id])

  if (!authLoading && !user) { router.push('/auth/login'); return null }

  const hourlyRate = venue ? parseFloat(venue.hourlyRate) : 0
  const basePrice  = hourlyRate * duration
  const fee        = basePrice * PLATFORM_FEE
  const total      = basePrice + fee

  // Build slot list from schedule
  const slots: { hour: number; available: boolean }[] = []
  if (availability?.schedule?.isOpen) {
    const { openHour, closeHour } = availability.schedule
    for (let h = openHour; h < closeHour; h++) {
      const endH = h + duration
      if (endH > closeHour) break
      const blocked = availability.bookings.some((b: any) =>
        (h >= b.startHour && h < b.endHour) ||
        (endH > b.startHour && endH <= b.endHour) ||
        (h <= b.startHour && endH >= b.endHour)
      )
      slots.push({ hour: h, available: !blocked })
    }
  }

  const handleBook = async () => {
    if (!selectedDate || selectedStart === null) return
    setError('')
    setSubmitting(true)
    try {
      const startTime = new Date(`${selectedDate}T${pad(selectedStart)}:00:00Z`).toISOString()
      const endTime   = new Date(`${selectedDate}T${pad(selectedStart + duration)}:00:00Z`).toISOString()
      await api.post('/api/bookings', {
        venueId: id,
        startTime,
        endTime,
        notes: notes || undefined,
      })
      setDone(true)
    } catch (err: any) {
      setError(err?.error || 'Error al crear la reserva')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-2">¡Reserva confirmada!</h1>
        <p className="text-gray-400 mb-8">
          {venue?.profile?.displayName} · {selectedDate} · {pad(selectedStart!)}:00 – {pad(selectedStart! + duration)}:00
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/bookings')} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            Ver mis reservas
          </button>
          <button onClick={() => router.push('/search?type=venue')} className="border border-[var(--border)] hover:border-[var(--accent)] px-6 py-2.5 rounded-lg transition-colors">
            Buscar más salas
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse"><div className="h-10 w-64 bg-[var(--muted)] rounded mb-8" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Reservar {venue?.profile?.displayName}</h1>
        <p className="text-gray-400 text-sm mt-1">📍 {venue?.address} · {hourlyRate}€/hora</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: calendar + slots */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-semibold mb-3">1. Elige un día</h2>
            <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>

          {selectedDate && (
            <div>
              <h2 className="font-semibold mb-3">2. Duración</h2>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(h => (
                  <button
                    key={h}
                    onClick={() => { setDuration(h); setSelectedStart(null) }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${duration === h ? 'bg-[var(--accent)] text-white' : 'bg-[var(--muted)] hover:bg-[var(--accent)]/20 border border-[var(--border)]'}`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && availability && (
            <div>
              <h2 className="font-semibold mb-3">3. Hora de inicio</h2>
              {!availability.schedule?.isOpen ? (
                <div className="bg-[var(--muted)] border border-[var(--border)] rounded-xl p-4 text-center text-gray-400 text-sm">
                  La sala está cerrada este día
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-[var(--muted)] border border-[var(--border)] rounded-xl p-4 text-center text-gray-400 text-sm">
                  No hay huecos disponibles para {duration}h este día
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(({ hour, available }) => (
                    <button
                      key={hour}
                      disabled={!available}
                      onClick={() => setSelectedStart(hour)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                        !available
                          ? 'bg-red-500/10 text-red-400/50 border border-red-500/10 cursor-not-allowed line-through'
                          : selectedStart === hour
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--muted)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {pad(hour)}:00
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div>
          <h2 className="font-semibold mb-3">Resumen</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sticky top-4">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[var(--border)]">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center text-xl">🏠</div>
              <div>
                <p className="font-semibold">{venue?.profile?.displayName}</p>
                <p className="text-xs text-gray-400">{venue?.address}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-400">Fecha</span>
                <span>{selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Horario</span>
                <span>
                  {selectedStart !== null ? `${pad(selectedStart)}:00 – ${pad(selectedStart + duration)}:00` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duración</span>
                <span>{duration}h × {hourlyRate}€</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-3">
                <span className="text-gray-400">Subtotal</span>
                <span>{basePrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gastos de gestión (10%)</span>
                <span>{fee.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[var(--border)] pt-3">
                <span>Total</span>
                <span className="text-[var(--accent)]">{total.toFixed(2)}€</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1.5">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="¿Algo que deba saber la sala?"
                rows={2}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!selectedDate || selectedStart === null || submitting}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
            >
              {submitting ? 'Confirmando...' : selectedStart !== null ? `Reservar ${pad(selectedStart)}:00 – ${pad(selectedStart + duration)}:00` : 'Selecciona fecha y hora'}
            </button>

            <p className="text-xs text-gray-600 text-center mt-3">Sin cargos hasta confirmar</p>
          </div>
        </div>
      </div>
    </div>
  )
}
