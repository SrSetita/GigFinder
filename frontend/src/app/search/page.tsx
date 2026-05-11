'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, SlidersHorizontal, X, Star, Euro } from 'lucide-react'
import { api } from '@/lib/api'
import GlassCard from '@/components/ui/GlassCard'

const TYPE_LABELS: Record<string, string> = {
  venue: 'Salas',
  band: 'Bandas',
  musician: 'Músicos',
  promoter: 'Promotores',
}

const ROLE_BADGES: Record<string, string> = {
  VENUE: 'Sala',
  BAND: 'Banda',
  MUSICIAN: 'Músico',
  PROMOTER: 'Promotor',
}

const ROLE_COLORS: Record<string, string> = {
  VENUE:    'bg-purple-500/10 text-purple-300 border-purple-500/20',
  BAND:     'bg-pink-500/10 text-pink-300 border-pink-500/20',
  MUSICIAN: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  PROMOTER: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const activeQ     = searchParams.get('q') || ''
  const activeType  = searchParams.get('type') || ''
  const activeCity  = searchParams.get('city') || ''
  const activeGenre = searchParams.get('genre') || ''

  const [form, setForm] = useState({ q: activeQ, type: activeType, city: activeCity, genre: activeGenre })

  useEffect(() => {
    setForm({
      q:     searchParams.get('q') || '',
      type:  searchParams.get('type') || '',
      city:  searchParams.get('city') || '',
      genre: searchParams.get('genre') || '',
    })
  }, [searchParams])

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeQ)     params.set('q', activeQ)
      if (activeType)  params.set('type', activeType)
      if (activeCity)  params.set('city', activeCity)
      if (activeGenre) params.set('genre', activeGenre)
      try {
        const data = await api.get<any[]>(`/api/search?${params}`)
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    doFetch()
  }, [activeQ, activeType, activeCity, activeGenre])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (form.q)     params.set('q', form.q)
    if (form.type)  params.set('type', form.type)
    if (form.city)  params.set('city', form.city)
    if (form.genre) params.set('genre', form.genre)
    router.push(`/search?${params}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyFilters()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar filtros */}
        <aside className="w-full md:w-64 shrink-0">
          <GlassCard className="p-6 flex flex-col gap-4 sticky top-20">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-[var(--accent)]" />
              <h2 className="font-bold">Filtros</h2>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.q}
                  onChange={(e) => setForm({ ...form, q: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre, ciudad..."
                  className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
              >
                <option value="">Todos</option>
                <option value="venue">Salas</option>
                <option value="band">Bandas</option>
                <option value="musician">Músicos</option>
                <option value="promoter">Promotores</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Ciudad</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Madrid..."
                  className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Género</label>
              <input
                type="text"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Rock, Jazz..."
                className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-gray-600"
              />
            </div>

            <button
              onClick={applyFilters}
              className="btn-primary-glow py-2 rounded-lg text-sm font-medium mt-1"
            >
              Buscar
            </button>

            {(activeQ || activeType || activeCity || activeGenre) && (
              <button
                onClick={() => router.push('/search')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs justify-center transition-colors"
              >
                <X size={12} />
                Limpiar filtros
              </button>
            )}
          </GlassCard>
        </aside>

        {/* Resultados */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">
              {activeType ? TYPE_LABELS[activeType] : 'Todos'}
              {activeCity  && <span className="text-gray-400 font-normal"> en {activeCity}</span>}
              {activeGenre && <span className="text-gray-400 font-normal"> · {activeGenre}</span>}
            </h1>
            {!loading && <span className="text-sm text-gray-500">{results.length} resultados</span>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-52 animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-500" />
              </div>
              <p className="font-medium">No se encontraron resultados</p>
              <p className="text-sm text-gray-600 mt-1">Prueba con otros filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((profile) => (
                <Link key={profile.id} href={`/profiles/${profile.id}`}>
                  <GlassCard hover glow className="overflow-hidden group cursor-pointer">
                    <div className="h-36 bg-gradient-to-br from-[var(--accent)]/20 to-white/[0.03] relative">
                      {profile.media?.[0] && (
                        <img src={profile.media[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                      {profile.isPremium && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-500/90 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                          <Star size={10} />
                          Premium
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors truncate">
                          {profile.displayName}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ml-2 ${ROLE_COLORS[profile.user?.role] || 'bg-white/[0.05] text-gray-400 border-white/[0.07]'}`}>
                          {ROLE_BADGES[profile.user?.role]}
                        </span>
                      </div>
                      {profile.city && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin size={11} />
                          {profile.city}
                        </p>
                      )}
                      {profile.genres?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {profile.genres.slice(0, 3).map((g: string) => (
                            <span key={g} className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                      {profile.venue && (
                        <p className="flex items-center gap-1 text-xs text-green-400 mt-2 font-medium">
                          <Euro size={11} />
                          {parseFloat(profile.venue.hourlyRate).toFixed(0)}/h
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  )
}
