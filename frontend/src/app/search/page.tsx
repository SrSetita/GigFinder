'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

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

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Valores activos en la URL (source of truth para el fetch y el título)
  const activeQ    = searchParams.get('q') || ''
  const activeType = searchParams.get('type') || ''
  const activeCity = searchParams.get('city') || ''
  const activeGenre = searchParams.get('genre') || ''

  // Estado local del formulario (lo que el usuario está editando)
  const [form, setForm] = useState({ q: activeQ, type: activeType, city: activeCity, genre: activeGenre })

  // Sincronizar formulario cuando cambia la URL (clicks en navbar, géneros, etc.)
  useEffect(() => {
    setForm({
      q: searchParams.get('q') || '',
      type: searchParams.get('type') || '',
      city: searchParams.get('city') || '',
      genre: searchParams.get('genre') || '',
    })
  }, [searchParams])

  // Fetch cada vez que cambian los parámetros de la URL
  useEffect(() => {
    const doFetch = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeQ)    params.set('q', activeQ)
      if (activeType) params.set('type', activeType)
      if (activeCity) params.set('city', activeCity)
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
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4 sticky top-4">
            <h2 className="font-bold">Filtros</h2>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Buscar</label>
              <input
                type="text"
                value={form.q}
                onChange={(e) => setForm({ ...form, q: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Nombre, ciudad..."
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="">Todos</option>
                <option value="venue">Salas</option>
                <option value="band">Bandas</option>
                <option value="musician">Músicos</option>
                <option value="promoter">Promotores</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Madrid..."
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Género</label>
              <input
                type="text"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Rock, Jazz..."
                className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <button
              onClick={applyFilters}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-sm font-medium transition-colors mt-2"
            >
              Buscar
            </button>

            {(activeQ || activeType || activeCity || activeGenre) && (
              <button
                onClick={() => router.push('/search')}
                className="text-gray-500 hover:text-gray-300 text-xs text-center transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        {/* Resultados */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">
              {activeType ? TYPE_LABELS[activeType] : 'Todos'}
              {activeCity && ` en ${activeCity}`}
              {activeGenre && ` · ${activeGenre}`}
            </h1>
            {!loading && <span className="text-sm text-gray-400">{results.length} resultados</span>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p>No se encontraron resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profiles/${profile.id}`}
                  className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/50 rounded-2xl overflow-hidden transition-colors group"
                >
                  <div className="h-32 bg-gradient-to-br from-[var(--accent)]/20 to-[var(--muted)] relative">
                    {profile.media?.[0] && (
                      <img src={profile.media[0].url} alt="" className="w-full h-full object-cover" />
                    )}
                    {profile.isPremium && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold group-hover:text-[var(--accent)] transition-colors">
                        {profile.displayName}
                      </h3>
                      <span className="text-xs bg-[var(--muted)] px-2 py-0.5 rounded-full text-gray-400">
                        {ROLE_BADGES[profile.user?.role]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{profile.city}</p>
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
                      <p className="text-xs text-green-400 mt-2 font-medium">
                        Desde {parseFloat(profile.venue.hourlyRate).toFixed(0)}€/h
                      </p>
                    )}
                  </div>
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
