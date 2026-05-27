'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, X, Star, Euro } from 'lucide-react'
import { api } from '@/lib/api'
import Card from '@/components/ui/Card'

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
  const [profiles, setProfiles] = useState<any[]>([])
  const [musicianBands, setMusicianBands] = useState<any[]>([])
  const [hasMoreProfiles, setHasMoreProfiles] = useState(false)
  const [hasMoreBands, setHasMoreBands] = useState(false)
  const [profilePage, setProfilePage] = useState(1)
  const [bandPage, setBandPage] = useState(1)
  const [loadingMoreProfiles, setLoadingMoreProfiles] = useState(false)
  const [loadingMoreBands, setLoadingMoreBands] = useState(false)
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

  const buildParams = (overrides: Record<string, string | number> = {}) => {
    const params = new URLSearchParams()
    if (activeQ)     params.set('q', activeQ)
    if (activeType)  params.set('type', activeType)
    if (activeCity)  params.set('city', activeCity)
    if (activeGenre) params.set('genre', activeGenre)
    Object.entries(overrides).forEach(([k, v]) => params.set(k, String(v)))
    return params
  }

  useEffect(() => {
    setProfilePage(1)
    setBandPage(1)
    const doFetch = async () => {
      setLoading(true)
      try {
        const data = await api.get<any>(`/api/search?${buildParams({ page: 1 })}`)
        setProfiles(data.profiles ?? [])
        setMusicianBands(data.musicianBands ?? [])
        setHasMoreProfiles(data.hasMoreProfiles ?? false)
        setHasMoreBands(data.hasMoreBands ?? false)
      } catch {
        setProfiles([])
        setMusicianBands([])
        setHasMoreProfiles(false)
        setHasMoreBands(false)
      } finally {
        setLoading(false)
      }
    }
    doFetch()
  }, [activeQ, activeType, activeCity, activeGenre])

  const loadMoreProfiles = async () => {
    setLoadingMoreProfiles(true)
    const nextPage = profilePage + 1
    try {
      const data = await api.get<any>(`/api/search?${buildParams({ page: nextPage })}`)
      setProfiles(prev => [...prev, ...(data.profiles ?? [])])
      setHasMoreProfiles(data.hasMoreProfiles ?? false)
      setProfilePage(nextPage)
    } catch {} finally {
      setLoadingMoreProfiles(false)
    }
  }

  const loadMoreBands = async () => {
    setLoadingMoreBands(true)
    const nextPage = bandPage + 1
    try {
      const data = await api.get<any>(`/api/search?${buildParams({ page: nextPage })}`)
      setMusicianBands(prev => [...prev, ...(data.musicianBands ?? [])])
      setHasMoreBands(data.hasMoreBands ?? false)
      setBandPage(nextPage)
    } catch {} finally {
      setLoadingMoreBands(false)
    }
  }

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

      {/* Search bar + inline filters */}
      <div className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={form.q}
              onChange={(e) => setForm({ ...form, q: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Nombre, ciudad..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Ciudad..."
              className="w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-[var(--text-secondary)]"
            />
          </div>
          <input
            type="text"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Género..."
            className="w-36 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors placeholder:text-[var(--text-secondary)]"
          />
          <button
            onClick={applyFilters}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            Buscar
          </button>
          {(activeQ || activeType || activeCity || activeGenre) && (
            <button
              onClick={() => router.push('/search')}
              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-colors px-2"
            >
              <X size={14} aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>

        {/* Filtros inline — debajo de la search bar */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(['venue', 'band', 'musician', 'promoter'] as const).map(type => (
            <button
              key={type}
              onClick={() => {
                const next = form.type === type ? '' : type
                const params = new URLSearchParams()
                if (form.q) params.set('q', form.q)
                if (next) params.set('type', next)
                if (form.city) params.set('city', form.city)
                if (form.genre) params.set('genre', form.genre)
                router.push(`/search?${params}`)
              }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors duration-150
                ${form.type === type
                  ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">
            {activeType ? TYPE_LABELS[activeType] : 'Todos'}
            {activeCity  && <span className="text-gray-400 font-normal"> en {activeCity}</span>}
            {activeGenre && <span className="text-gray-400 font-normal"> · {activeGenre}</span>}
          </h1>
          {!loading && <span className="text-sm text-gray-500">{profiles.length + musicianBands.length} resultados</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl h-52 animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 && musicianBands.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-500" />
            </div>
            <p className="font-medium">No se encontraron resultados</p>
            <p className="text-sm text-gray-600 mt-1">Prueba con otros filtros</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <Link key={profile.id} href={`/profiles/${profile.id}`}>
                  <Card hover className="overflow-hidden group cursor-pointer">
                    <div className="h-36 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--surface)] relative">
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
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ml-2 ${ROLE_COLORS[profile.user?.role] || 'bg-[var(--surface-raised)] text-gray-400 border-[var(--border)]'}`}>
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
                  </Card>
                </Link>
              ))}
            </div>

            {hasMoreProfiles && (
              <div className="mt-4 text-center">
                <button
                  onClick={loadMoreProfiles}
                  disabled={loadingMoreProfiles}
                  className="btn-ghost px-6 py-2 text-sm font-medium disabled:opacity-40"
                >
                  {loadingMoreProfiles ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}

            {/* Musician-owned bands */}
            {musicianBands.length > 0 && (
              <>
                {(!activeType || activeType === 'band') && profiles.length > 0 && (
                  <h2 className="text-sm font-semibold text-gray-400 mt-6 mb-3">Bandas independientes</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {musicianBands.map((band) => (
                    <Link key={band.id} href={`/bands/${band.id}`}>
                      <Card hover className="overflow-hidden group cursor-pointer">
                        <div className="h-36 bg-gradient-to-br from-pink-500/20 to-[var(--surface)] relative">
                          {band.media?.[0] && (
                            <img src={band.media[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors truncate">
                              {band.displayName}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full border shrink-0 ml-2 bg-pink-500/10 text-pink-300 border-pink-500/20">
                              Banda
                            </span>
                          </div>
                          {band.city && (
                            <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <MapPin size={11} />
                              {band.city}
                            </p>
                          )}
                          {band.genres?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {band.genres.slice(0, 3).map((g: string) => (
                                <span key={g} className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                          {band.memberCount > 0 && (
                            <p className="text-xs text-gray-500 mt-2">{band.memberCount} miembro{band.memberCount !== 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {hasMoreBands && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={loadMoreBands}
                      disabled={loadingMoreBands}
                      className="btn-ghost px-6 py-2 text-sm font-medium disabled:opacity-40"
                    >
                      {loadingMoreBands ? 'Cargando...' : 'Cargar más bandas'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
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
