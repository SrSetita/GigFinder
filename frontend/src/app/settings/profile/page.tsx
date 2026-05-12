'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Camera, Play, Globe, Music2, Radio, AtSign, Link2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/ui/GlassCard'

const GENRE_OPTIONS = [
  'Rock', 'Metal', 'Pop', 'Jazz', 'Blues', 'Funk', 'Soul', 'R&B',
  'Hip-Hop', 'Electronic', 'Indie', 'Punk', 'Folk', 'Clásica', 'Reggae',
  'Latin', 'Flamenco', 'Country', 'Experimental', 'Ambient',
]

const INSTRUMENT_OPTIONS = [
  'Guitarra', 'Bajo', 'Batería', 'Teclado', 'Piano', 'Voz', 'Saxofón',
  'Trompeta', 'Trombón', 'Violín', 'Cello', 'Flauta', 'Armónica',
  'DJ / Producción', 'Otro',
]

const WANTED_ROLES = ['Guitarra', 'Bajo', 'Batería', 'Teclado', 'Voz', 'Saxofón', 'Trompeta', 'Trombón', 'Otro']

const EVENT_TYPES = ['Concierto', 'Festival', 'Privado', 'Boda', 'Corporativo', 'Club', 'Teatro', 'Al aire libre']

const SOCIAL_PLATFORMS = ['instagram', 'spotify', 'youtube', 'soundcloud', 'twitter', 'facebook', 'web']

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram:  Camera,
  spotify:    Music2,
  youtube:    Play,
  soundcloud: Radio,
  twitter:    AtSign,
  facebook:   Globe,
  web:        Globe,
}

function ChipSelector({ options, selected, onChange }: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => toggle(o)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            selected.includes(o)
              ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
              : 'border-white/[0.07] text-gray-400 hover:border-[var(--accent)]/40 hover:text-white'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function EditProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === '1'
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})

  const [instruments, setInstruments] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState('')
  const [lookingForBand, setLookingForBand] = useState(false)
  const [openToCollabs, setOpenToCollabs] = useState(true)

  const [lookingForMembers, setLookingForMembers] = useState(false)
  const [wantedRoles, setWantedRoles] = useState<string[]>([])

  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [website, setWebsite] = useState('')

  const [isPublic, setIsPublic] = useState(true)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    api.get<any>('/api/profiles/me')
      .then((p) => {
        setProfile(p)
        setDisplayName(p.displayName || '')
        setBio(p.bio || '')
        setCity(p.city || '')
        setGenres(p.genres || [])
        setSocialLinks(p.socialLinks || {})
        setIsPublic(p.isPublic ?? true)
        setAvatarPreview(p.avatarUrl || null)
        setBannerPreview(p.bannerUrl || null)
        if (p.musician) {
          setInstruments(p.musician.instruments || [])
          setYearsExperience(p.musician.yearsExperience?.toString() || '')
          setLookingForBand(p.musician.lookingForBand || false)
          setOpenToCollabs(p.musician.openToCollabs ?? true)
        }
        if (p.band) {
          setLookingForMembers(p.band.lookingForMembers || false)
          setWantedRoles(p.band.wantedRoles || [])
        }
        if (p.promoter) {
          setEventTypes(p.promoter.eventTypes || [])
          setWebsite(p.promoter.website || '')
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [user, router])

  const uploadFile = async (file: File, endpoint: string): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('gf_token')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}${endpoint}`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
    )
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const url = await uploadFile(file, '/api/upload/avatar')
      setAvatarPreview(url)
    } catch {
      setAvatarPreview(profile?.avatarUrl || null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerPreview(URL.createObjectURL(file))
    setUploadingBanner(true)
    try {
      const url = await uploadFile(file, '/api/upload/banner')
      setBannerPreview(url)
    } catch {
      setBannerPreview(profile?.bannerUrl || null)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      await api.patch('/api/profiles/me', { displayName, bio, city, genres, socialLinks, isPublic })

      const role = profile?.user?.role
      if (role === 'MUSICIAN') {
        await api.patch('/api/profiles/me/musician', {
          instruments,
          yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
          lookingForBand,
          openToCollabs,
        })
      } else if (role === 'BAND') {
        await api.patch('/api/profiles/me/band', { lookingForMembers, wantedRoles })
      } else if (role === 'PROMOTER') {
        await api.patch('/api/profiles/me/promoter', { eventTypes, website })
      }

      router.push(isWelcome ? `/profiles/${profile.id}` : `/profiles/${profile.id}?saved=1`)
    } catch (err: any) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setSaveError('No se pudo conectar con el servidor.')
      } else {
        setSaveError(err?.error ? JSON.stringify(err.error) : (err?.message || 'Error al guardar los cambios.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const updateSocialLink = (platform: string, value: string) => {
    setSocialLinks((prev) => {
      if (!value) {
        const { [platform]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [platform]: value }
    })
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.05] rounded mb-8" />
        <div className="h-40 bg-white/[0.05] rounded-2xl mb-6" />
        <div className="h-64 bg-white/[0.05] rounded-2xl" />
      </div>
    )
  }

  const role = profile?.user?.role

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {isWelcome && (
        <div className="mb-6 flex items-center gap-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-2xl px-5 py-4">
          <Sparkles size={18} className="text-[var(--accent)] shrink-0" />
          <div>
            <p className="font-semibold text-sm">¡Bienvenido a GigFinder!</p>
            <p className="text-xs text-gray-400 mt-0.5">Completa tu perfil para que otros puedan encontrarte. Cuanto más completo, mejor visibilidad.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        {!isWelcome && (
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Volver
          </button>
        )}
        <h1 className="text-2xl font-bold">{isWelcome ? 'Completa tu perfil' : 'Editar perfil'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Banner + Avatar */}
        <GlassCard className="overflow-hidden">
          <div
            className="h-36 bg-gradient-to-br from-[var(--accent)]/25 to-white/[0.02] relative cursor-pointer group"
            onClick={() => bannerInputRef.current?.click()}
          >
            {bannerPreview && (
              <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-2 text-white text-sm font-medium">
                <Camera size={16} />
                {uploadingBanner ? 'Subiendo...' : 'Cambiar banner'}
              </span>
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4 relative z-10">
              <div
                className="w-20 h-20 rounded-full border-4 border-[#12121f] bg-[var(--accent)] flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer relative group flex-shrink-0"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  displayName?.[0]?.toUpperCase()
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera size={16} className="text-white" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-xs text-gray-500 pb-1">Clic en avatar o banner para cambiarlos</p>
            </div>
          </div>
        </GlassCard>

        {/* Visibilidad */}
        <GlassCard className="p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Visibilidad</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{isPublic ? 'Perfil público — visible para todos' : 'Perfil privado — no aparece en búsquedas'}</span>
            <button type="button" onClick={() => setIsPublic(v => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'left-6' : 'left-1'}`} />
            </button>
          </label>
        </GlassCard>

        {/* Basic info */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Información básica</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nombre / Nombre artístico</label>
            <input
              type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              required minLength={2} maxLength={60}
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
            <input
              type="text" value={city} onChange={(e) => setCity(e.target.value)} required
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
            <textarea
              value={bio} onChange={(e) => setBio(e.target.value)}
              maxLength={1000} rows={4}
              placeholder="Cuéntanos sobre ti o tu proyecto..."
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/1000</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Géneros</label>
            <ChipSelector options={GENRE_OPTIONS} selected={genres} onChange={setGenres} />
          </div>
        </GlassCard>

        {/* Social links */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Redes y plataformas</h2>
          {SOCIAL_PLATFORMS.map((platform) => {
            const Icon = SOCIAL_ICONS[platform] || Link2
            return (
              <div key={platform} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={socialLinks[platform] || ''}
                  onChange={(e) => updateSocialLink(platform, e.target.value)}
                  placeholder={
                    platform === 'web' ? 'https://mipagina.com'
                    : platform === 'spotify' ? 'URL de artista o usuario'
                    : `@usuario o URL`
                  }
                  className="flex-1 bg-white/[0.05] border border-white/[0.07] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                />
              </div>
            )
          })}
        </GlassCard>

        {/* Role-specific */}
        {role === 'MUSICIAN' && (
          <GlassCard className="p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Información de músico</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Instrumentos</label>
              <ChipSelector options={INSTRUMENT_OPTIONS} selected={instruments} onChange={setInstruments} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Años de experiencia</label>
              <input
                type="number" min={0} max={60} value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-32 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Busco banda', state: lookingForBand, set: setLookingForBand },
                { label: 'Abierto a colaboraciones', state: openToCollabs, set: setOpenToCollabs },
              ].map(({ label, state, set }) => (
                <label key={label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">{label}</span>
                  <button
                    type="button"
                    onClick={() => set(!state)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${state ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${state ? 'left-6' : 'left-1'}`} />
                  </button>
                </label>
              ))}
            </div>
          </GlassCard>
        )}

        {role === 'BAND' && (
          <GlassCard className="p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Información de banda</h2>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Buscamos miembros</span>
              <button
                type="button"
                onClick={() => setLookingForMembers(!lookingForMembers)}
                className={`w-11 h-6 rounded-full transition-colors relative ${lookingForMembers ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${lookingForMembers ? 'left-6' : 'left-1'}`} />
              </button>
            </label>

            {lookingForMembers && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Roles que buscamos</label>
                <ChipSelector options={WANTED_ROLES} selected={wantedRoles} onChange={setWantedRoles} />
              </div>
            )}
          </GlassCard>
        )}

        {role === 'PROMOTER' && (
          <GlassCard className="p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Información de promotor</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Tipos de eventos</label>
              <ChipSelector options={EVENT_TYPES} selected={eventTypes} onChange={setEventTypes} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Web</label>
              <input
                type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://mipromotora.com"
                className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
              />
            </div>
          </GlassCard>
        )}

        {saveError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploadingAvatar || uploadingBanner}
            className="btn-primary-glow px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:transform-none"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { Suspense } from 'react'
export default function EditProfilePageWrapper() {
  return <Suspense><EditProfilePage /></Suspense>
}
