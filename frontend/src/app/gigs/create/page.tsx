'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import MeshBackground from '@/components/ui/MeshBackground'
import GlassCard from '@/components/ui/GlassCard'
import { useToast } from '@/lib/ToastContext'

const OFFER_TYPES = [
  { value: 'venue_needed',    label: 'Busco sala / local' },
  { value: 'musician_needed', label: 'Busco músico' },
  { value: 'band_needed',     label: 'Busco banda' },
  { value: 'promoter_needed', label: 'Busco promotor' },
]

const GENRES_SUGGESTIONS = ['Rock', 'Pop', 'Jazz', 'Flamenco', 'Electrónica', 'Hip-Hop', 'Metal', 'Clásica', 'Reggaeton', 'Folk']

export default function CreateGigPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({
    title:       '',
    description: '',
    city:        '',
    date:        '',
    budget:      '',
    offerType:   'venue_needed',
    genreInput:  '',
    genres:      [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && !user) {
    router.push('/auth/login')
    return null
  }

  const addGenre = (g: string) => {
    const trimmed = g.trim()
    if (!trimmed || form.genres.includes(trimmed)) return
    setForm(f => ({ ...f, genres: [...f.genres, trimmed], genreInput: '' }))
  }

  const removeGenre = (g: string) => {
    setForm(f => ({ ...f, genres: f.genres.filter(x => x !== g) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/gig-offers', {
        title:       form.title,
        description: form.description || undefined,
        city:        form.city,
        date:        form.date ? new Date(form.date).toISOString() : undefined,
        budget:      form.budget ? parseFloat(form.budget) : undefined,
        offerType:   form.offerType,
        genres:      form.genres,
      })
      toast('Oferta publicada', 'success')
      router.push('/gigs')
    } catch (err: any) {
      setError(err?.error || 'Error al publicar')
      setSubmitting(false)
    }
  }

  return (
    <MeshBackground className="min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto relative z-10">
        <Link href="/gigs" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} />
          Volver al tablón
        </Link>

        <h1 className="text-2xl font-bold mb-6">Publicar oferta</h1>

        <GlassCard className="p-8 glass-blur">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-6 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Tipo de oferta</label>
              <div className="grid grid-cols-2 gap-2">
                {OFFER_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, offerType: t.value }))}
                    className={`text-sm py-2.5 px-3 rounded-xl border transition-all font-medium ${
                      form.offerType === t.value
                        ? 'border-[var(--accent)]/60 bg-[var(--accent)]/10 text-white'
                        : 'border-white/[0.07] text-[var(--text-secondary)] hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Título *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Banda busca sala en Madrid para ensayo sabatino"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Más detalles sobre lo que buscas..."
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Ciudad *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="Madrid"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Presupuesto (€)</label>
                <input
                  type="number"
                  min="0"
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder="200"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Fecha (opcional)</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Géneros</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {form.genres.map(g => (
                  <span key={g} className="flex items-center gap-1 bg-[var(--accent)]/15 text-[var(--accent)] px-3 py-1 rounded-full text-xs">
                    {g}
                    <button type="button" onClick={() => removeGenre(g)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={form.genreInput}
                onChange={e => setForm(f => ({ ...f, genreInput: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGenre(form.genreInput) } }}
                placeholder="Escribe un género y pulsa Enter"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)] mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {GENRES_SUGGESTIONS.filter(g => !form.genres.includes(g)).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => addGenre(g)}
                    className="text-xs text-[var(--text-secondary)] hover:text-white border border-white/[0.07] hover:border-white/20 px-2.5 py-1 rounded-full transition-colors"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-glow py-3 rounded-xl font-semibold mt-2 disabled:opacity-50 disabled:transform-none"
            >
              {submitting ? 'Publicando...' : 'Publicar oferta'}
            </button>
          </form>
        </GlassCard>
      </div>
    </MeshBackground>
  )
}
