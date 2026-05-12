'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Euro, CalendarDays, Clock, AlertCircle, CheckCircle2, Search, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Calendar from '@/components/booking/Calendar'
import GlassCard from '@/components/ui/GlassCard'

const PLATFORM_FEE = 0.10

function pad(n: number) { return String(n).padStart(2, '0') }

export default function BookVenuePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [venue, setVenue]               = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [selectedStart, setSelectedStart] = useState<number | null>(null)
  const [duration, setDuration]         = useState(2)
  const [notes, setNotes]               = useState('')
  const [myBands, setMyBands]           = useState<any[]>([])
  const [selectedBandId, setSelectedBandId] = useState<string>('')
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const [done, setDone]                 = useState(false)

  useEffect(() => {
    api.get<any>(`/api/venues/${id}`)
      .then(setVenue)
      .finally(() => setLoading(false))
    api.get<any[]>('/api/bands/mine')
      .then(bands => {
        setMyBands(bands)
        if (user?.role === 'BAND' && bands.length > 0) {
          setSelectedBandId(bands[0].id)
        }
      })
      .catch(() => {})
  }, [id, user?.role])

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
        bandId: selectedBandId || undefined,
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
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-400 mb-2">
          {venue?.profile?.displayName} recibirá tu solicitud y la aceptará o rechazará.
          {selectedBandId && myBands.find(b => b.id === selectedBandId) && (
            <span className="block text-sm text-gray-500 mt-1">
              Reservado como banda: {myBands.find(b => b.id === selectedBandId)?.name}
            </span>
          )}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {selectedDate} · {pad(selectedStart!)}:00 – {pad(selectedStart! + duration)}:00
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/bookings')}
            className="btn-primary-glow px-6 py-2.5 rounded-lg font-medium flex items-center gap-2"
          >
            <CalendarDays size={16} />
            Ver mis solicitudes
          </button>
          <button
            onClick={() => router.push('/search?type=venue')}
            className="glass hover:border-[var(--accent)]/30 px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Search size={16} />
            Más salas
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse"><div className="h-10 w-64 bg-white/[0.05] rounded mb-8" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <h1 className="text-2xl font-bold">Reservar {venue?.profile?.displayName}</h1>
        <p className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
          <MapPin size={13} />
          {venue?.address}
          <span className="mx-1 text-gray-600">·</span>
          <Euro size={11} />
          {hourlyRate}/hora
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      duration === h
                        ? 'bg-[var(--accent)] text-white'
                        : 'glass hover:border-[var(--accent)]/30'
                    }`}
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
                <GlassCard className="p-4 text-center text-gray-400 text-sm">
                  La sala está cerrada este día
                </GlassCard>
              ) : slots.length === 0 ? (
                <GlassCard className="p-4 text-center text-gray-400 text-sm">
                  No hay huecos disponibles para {duration}h este día
                </GlassCard>
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
                            : 'glass hover:border-[var(--accent)]/40'
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

        <div>
          <h2 className="font-semibold mb-3">Resumen</h2>
          <GlassCard className="p-6 sticky top-20">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
                <MapPin size={20} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-semibold">{venue?.profile?.displayName}</p>
                <p className="text-xs text-gray-400">{venue?.address}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm mb-5">
              {[
                { label: 'Fecha', value: selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '—', icon: CalendarDays },
                { label: 'Horario', value: selectedStart !== null ? `${pad(selectedStart)}:00 – ${pad(selectedStart + duration)}:00` : '—', icon: Clock },
                { label: 'Duración', value: `${duration}h × ${hourlyRate}€`, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Icon size={13} />
                    {label}
                  </span>
                  <span>{value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-gray-400">Subtotal</span>
                <span>{basePrice.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gestión (10%)</span>
                <span>{fee.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-white/[0.06] pt-3">
                <span>Total</span>
                <span className="text-[var(--accent)]">{total.toFixed(2)}€</span>
              </div>
            </div>

            {myBands.length > 0 && (
              <div className="mb-4">
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <Users size={11} />
                  Reservar como
                </label>
                <div className="flex flex-col gap-1.5">
                  {user?.role !== 'BAND' && (
                    <button
                      type="button"
                      onClick={() => setSelectedBandId('')}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selectedBandId === ''
                          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10 text-white'
                          : 'border-white/[0.07] bg-white/[0.03] text-gray-400 hover:border-white/[0.15]'
                      }`}
                    >
                      Yo mismo
                    </button>
                  )}
                  {myBands.map(band => (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => setSelectedBandId(band.id)}
                      className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                        selectedBandId === band.id
                          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10 text-white'
                          : 'border-white/[0.07] bg-white/[0.03] text-gray-400 hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {band.name?.[0]?.toUpperCase()}
                      </div>
                      {band.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1.5">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="¿Algo que deba saber la sala?"
                rows={2}
                className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-3 py-2 mb-4">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={handleBook}
              disabled={!selectedDate || selectedStart === null || submitting}
              className="w-full btn-primary-glow py-3 rounded-xl font-semibold disabled:opacity-40 disabled:transform-none disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Enviando solicitud...'
                : selectedStart !== null
                  ? `Solicitar ${pad(selectedStart)}:00 – ${pad(selectedStart + duration)}:00`
                  : 'Selecciona fecha y hora'
              }
            </button>

            <p className="text-xs text-gray-600 text-center mt-3">La sala revisará tu solicitud antes de confirmar</p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
