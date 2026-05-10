'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  MUSICIAN: 'Músico',
  BAND: 'Banda',
  VENUE: 'Sala de ensayo',
  PROMOTER: 'Promotor',
}

const SOCIAL_ICONS: Record<string, string> = {
  instagram: '📸',
  spotify: '🎵',
  youtube: '▶️',
  soundcloud: '☁️',
  twitter: '🐦',
  facebook: '📘',
  web: '🌐',
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchParams.get('saved') === '1') {
      setShowSavedToast(true)
      const t = setTimeout(() => setShowSavedToast(false), 3500)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  useEffect(() => {
    api.get<any>(`/api/profiles/${id}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/upload/media`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (res.ok) {
        const media = await res.json()
        setProfile((prev: any) => ({ ...prev, media: [...(prev.media || []), media] }))
      }
    } finally {
      setUploading(false)
      if (mediaInputRef.current) mediaInputRef.current.value = ''
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/api/upload/media/${mediaId}`)
      setProfile((prev: any) => ({ ...prev, media: prev.media.filter((m: any) => m.id !== mediaId) }))
    } catch {}
  }

  const handleContact = async () => {
    if (!user) { router.push('/auth/login'); return }
    setMessaging(true)
    try {
      await api.post('/api/messages/send', {
        recipientId: profile.userId,
        content: `Hola ${profile.displayName}, me gustaría ponerme en contacto contigo.`,
      })
      router.push('/messages')
    } catch {
      setMessaging(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-[var(--muted)] mb-6" />
        <div className="h-8 w-64 bg-[var(--muted)] rounded mb-3" />
        <div className="h-4 w-48 bg-[var(--muted)] rounded" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-gray-400">Este perfil no existe o ha sido eliminado.</p>
      </div>
    )
  }

  const isOwnProfile = user?.profile?.id === id
  const role = profile.user?.role

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Saved toast */}
      {showSavedToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <span>✓</span>
          <span>Cambios guardados correctamente</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-br from-[var(--accent)]/30 to-[var(--muted)] relative">
          {profile.bannerUrl && (
            <img
              src={profile.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {profile.isPremium && (
            <span className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-semibold">
              Premium
            </span>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-12 mb-4 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-[var(--card)] bg-[var(--accent)] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.displayName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => router.push('/settings/profile')}
                  className="border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 active:scale-95 text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Editar perfil
                </button>
              ) : (
                <button
                  onClick={handleContact}
                  disabled={messaging}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  {messaging ? 'Enviando...' : '💬 Contactar'}
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <span className="text-xs bg-[var(--muted)] border border-[var(--border)] px-2 py-0.5 rounded-full text-gray-400">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
            <p className="text-gray-400 text-sm">📍 {profile.city}{profile.country !== 'ES' ? `, ${profile.country}` : ''}</p>
          </div>

          {/* Genres */}
          {profile.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.genres.map((g: string) => (
                <span key={g} className="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1 rounded-full text-sm">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-300 mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Social links */}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {Object.entries(profile.socialLinks).map(([platform, handle]) => (
                <span
                  key={platform}
                  className="flex items-center gap-1.5 text-sm text-gray-400 bg-[var(--muted)] px-3 py-1.5 rounded-lg"
                >
                  <span>{SOCIAL_ICONS[platform] || '🔗'}</span>
                  <span>{String(handle)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: role-specific info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {/* Musician */}
          {role === 'MUSICIAN' && profile.musician && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Instrumentos</h2>
              {profile.musician.instruments?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.musician.instruments.map((i: string) => (
                    <span key={i} className="bg-[var(--muted)] px-3 py-1 rounded-full text-sm">{i}</span>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">Sin especificar</p>}
              {profile.musician.yearsExperience && (
                <p className="text-gray-400 text-sm mt-3">🎓 {profile.musician.yearsExperience} años de experiencia</p>
              )}
              {profile.musician.lookingForBand && (
                <p className="text-green-400 text-sm mt-2 font-medium">✅ Busca banda</p>
              )}
              {profile.musician.openToCollabs && (
                <p className="text-blue-400 text-sm mt-1">🤝 Abierto a colaboraciones</p>
              )}
            </div>
          )}

          {/* Band */}
          {role === 'BAND' && profile.band && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Banda</h2>
              {profile.band.lookingForMembers && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                  <p className="text-green-400 text-sm font-medium">✅ Busca miembros</p>
                  {profile.band.wantedRoles?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.band.wantedRoles.map((r: string) => (
                        <span key={r} className="bg-green-500/10 text-green-300 text-xs px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {profile.band.members?.length > 0 && (
                <>
                  <p className="text-sm text-gray-400 mb-2">Miembros ({profile.band.members.length})</p>
                  <div className="flex flex-col gap-2">
                    {profile.band.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs text-white font-medium">
                          {m.musician?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span>{m.musician?.profile?.displayName}</span>
                        <span className="text-gray-500">· {m.role}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Venue */}
          {role === 'VENUE' && profile.venue && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Sala</h2>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Precio/hora</span>
                  <span className="font-semibold text-green-400">{parseFloat(profile.venue.hourlyRate).toFixed(0)}€</span>
                </div>
                {profile.venue.capacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacidad</span>
                    <span>{profile.venue.capacity} personas</span>
                  </div>
                )}
                {profile.venue.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dirección</span>
                    <span className="text-right">{profile.venue.address}</span>
                  </div>
                )}
              </div>
              {profile.venue.amenities?.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-400 text-xs mb-2">Equipamiento</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.venue.amenities.map((a: string) => (
                      <span key={a} className="bg-[var(--muted)] text-xs px-2 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {!isOwnProfile && (
                <button
                  onClick={() => router.push(`/venues/${profile.venue.id}/book`)}
                  className="w-full mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  Reservar sala
                </button>
              )}
            </div>
          )}

          {/* Promoter */}
          {role === 'PROMOTER' && profile.promoter && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="font-semibold mb-3">Promotor</h2>
              {profile.promoter.eventTypes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.promoter.eventTypes.map((t: string) => (
                    <span key={t} className="bg-[var(--muted)] px-3 py-1 rounded-full text-sm">{t}</span>
                  ))}
                </div>
              )}
              {profile.promoter.website && (
                <p className="text-[var(--accent)] text-sm mt-3">🌐 {profile.promoter.website}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: media */}
        <div className="md:col-span-2">
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleMediaUpload}
          />
          {profile.media?.length > 0 ? (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Fotos y vídeos</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {uploading ? 'Subiendo...' : '+ Subir media'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.media.map((m: any) => (
                  <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-[var(--muted)] relative group">
                    {m.type === 'IMAGE' ? (
                      <img src={m.url} alt={m.title || ''} className="w-full h-full object-cover" />
                    ) : m.type === 'VIDEO' ? (
                      <video src={m.url} className="w-full h-full object-cover" controls />
                    ) : null}
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteMedia(m.id)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-10 text-center text-gray-500">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm">Sin fotos ni vídeos todavía</p>
              {isOwnProfile && (
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-3 text-[var(--accent)] text-sm hover:underline disabled:opacity-50"
                >
                  {uploading ? 'Subiendo...' : 'Subir media'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
