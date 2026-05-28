'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { MapPin, Euro, Calendar, Plus, Guitar, Building2, Mic2, Megaphone, SlidersHorizontal, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/ui/GlassCard'
import { SkeletonGigCard } from '@/components/ui/Skeleton'
import MeshBackground from '@/components/ui/MeshBackground'

const OFFER_TYPES = [
  { value: '',                  label: 'Todos' },
  { value: 'venue_needed',      label: 'Busca sala',      icon: Building2, color: 'purple' },
  { value: 'musician_needed',   label: 'Busca músico',    icon: Guitar,    color: 'blue' },
  { value: 'band_needed',       label: 'Busca banda',     icon: Mic2,      color: 'pink' },
  { value: 'promoter_needed',   label: 'Busca promotor',  icon: Megaphone, color: 'orange' },
]

const TYPE_COLORS: Record<string, string> = {
  venue_needed:    'bg-purple-500/10 text-purple-300 border-purple-500/20',
  musician_needed: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  band_needed:     'bg-pink-500/10 text-pink-300 border-pink-500/20',
  promoter_needed: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
}

const TYPE_LABELS: Record<string, string> = {
  venue_needed:    'Busca sala',
  musician_needed: 'Busca músico',
  band_needed:     'Busca banda',
  promoter_needed: 'Busca promotor',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GigsContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const activeType = searchParams.get('offerType') || ''
  const activeCity = searchParams.get('city') || ''
  const [city, setCity] = useState(activeCity)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeType) params.set('offerType', activeType)
    if (activeCity) params.set('city', activeCity)
    api.get<any[]>(`/api/gig-offers?${params}`)
      .then(setGigs)
      .catch(() => setGigs([]))
      .finally(() => setLoading(false))
  }, [activeType, activeCity])

  const applyCity = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) params.set('city', city)
    else params.delete('city')
    router.push(`/gigs?${params}`)
  }

  const setType = (t: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (t) params.set('offerType', t)
    else params.delete('offerType')
    router.push(`/gigs?${params}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Tablón de Gigs</h1>
          <p className="text-[var(--text-secondary)] text-sm">Ofertas publicadas por la comunidad</p>
        </div>
        {user && (
          <Link
            href="/gigs/create"
            className="btn-primary-glow px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Publicar oferta
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {OFFER_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeType === t.value
                ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-white'
                : 'border-white/[0.1] text-[var(--text-secondary)] hover:border-white/20 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex gap-2 ml-auto">
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCity()}
              placeholder="Ciudad..."
              className="bg-white/[0.05] border border-white/[0.07] rounded-full pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-[var(--text-muted)] w-36"
            />
          </div>
          {(activeType || activeCity) && (
            <button
              onClick={() => { setCity(''); router.push('/gigs') }}
              className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonGigCard key={i} />)}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
            <Guitar size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="font-medium">Sin ofertas publicadas</p>
          {user && (
            <Link href="/gigs/create" className="text-[var(--accent)] hover:underline text-sm mt-2 inline-block">
              Sé el primero en publicar
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gigs.map(gig => (
            <Link key={gig.id} href={`/profiles/${gig.author?.profile?.id}`}>
              <GlassCard hover className="p-5 h-full flex flex-col gap-3 group cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors line-clamp-2 flex-1">
                    {gig.title}
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium ${TYPE_COLORS[gig.offerType]}`}>
                    {TYPE_LABELS[gig.offerType]}
                  </span>
                </div>

                {gig.description && (
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{gig.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] mt-auto">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {gig.city}
                  </span>
                  {gig.date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(gig.date)}
                    </span>
                  )}
                  {gig.budget && (
                    <span className="flex items-center gap-1 text-green-400 font-medium">
                      <Euro size={11} /> {parseFloat(gig.budget).toFixed(0)}
                    </span>
                  )}
                </div>

                {gig.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {gig.genres.slice(0, 4).map((g: string) => (
                      <span key={g} className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-xs font-bold">
                    {gig.author?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{gig.author?.profile?.displayName}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-auto">
                    {new Date(gig.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GigsPage() {
  return (
    <Suspense>
      <GigsContent />
    </Suspense>
  )
}
