'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  MapPin, GraduationCap, CheckCircle2, Handshake, Users, Film,
  Plus, X, MessageCircle, Edit3, Building2,
  Camera, Play, Globe, Music2, Radio, AtSign, Link2,
  CalendarDays, Megaphone, CheckCircle, Star, UserPlus, Settings, UserMinus,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import GlassCard from '@/components/ui/GlassCard'
import { useToast } from '@/lib/ToastContext'
import { SkeletonProfile } from '@/components/ui/Skeleton'

const ROLE_LABELS: Record<string, string> = {
  MUSICIAN: 'Músico',
  BAND:     'Banda',
  VENUE:    'Sala de ensayo',
  PROMOTER: 'Promotor',
}

const ROLE_BANNER: Record<string, string> = {
  MUSICIAN: 'from-blue-900/40 via-[var(--accent)]/20 to-indigo-900/30',
  BAND:     'from-pink-900/40 via-purple-900/30 to-[var(--accent)]/20',
  VENUE:    'from-[var(--accent)]/30 via-purple-900/20 to-indigo-900/30',
  PROMOTER: 'from-orange-900/30 via-red-900/20 to-pink-900/30',
}

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram:  Camera,
  spotify:    Music2,
  youtube:    Play,
  soundcloud: Radio,
  twitter:    AtSign,
  facebook:   Globe,
  web:        Globe,
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [myRating, setMyRating] = useState(0)
  const [myReviewBody, setMyReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchParams.get('saved') === '1') {
      toast('Cambios guardados correctamente', 'success')
    }
  }, [searchParams])

  useEffect(() => {
    api.get<any>(`/api/profiles/${id}`)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
    api.get<any[]>(`/api/reviews/profile/${id}`)
      .then(data => {
        setReviews(data)
        if (user) {
          const mine = data.find((r: any) => r.reviewerId === user.id)
          if (mine) { setMyRating(mine.rating); setMyReviewBody(mine.body || '') }
        }
      })
      .catch(() => {})
  }, [id])

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const token = localStorage.getItem('gf_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/upload/media`, {
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !profile?.band?.id) return
    setInviting(true)
    try {
      await api.post(`/api/bands/${profile.band.id}/invite`, { email: inviteEmail })
      setInviteEmail('')
      toast('Invitación enviada', 'success')
    } catch (err: any) {
      toast(err?.error || 'Error al invitar', 'error')
    } finally {
      setInviting(false)
    }
  }

  const handleKick = async (targetUserId: string) => {
    if (!profile?.band?.id) return
    try {
      await api.delete(`/api/bands/${profile.band.id}/members/${targetUserId}`)
      setProfile((prev: any) => ({
        ...prev,
        band: { ...prev.band, members: prev.band.members.filter((m: any) => m.userId !== targetUserId) },
      }))
      toast('Miembro expulsado', 'success')
    } catch {
      toast('Error al expulsar miembro', 'error')
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!myRating) return
    setSubmittingReview(true)
    try {
      const saved = await api.post<any>('/api/reviews', { profileId: id, rating: myRating, body: myReviewBody || undefined })
      setReviews(prev => {
        const others = prev.filter(r => r.reviewerId !== user?.id)
        return [saved, ...others]
      })
      toast('Reseña guardada', 'success')
    } catch {
      toast('Error al guardar la reseña', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <GlassCard className="overflow-hidden mb-6">
          <SkeletonProfile />
        </GlassCard>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-gray-400">Este perfil no existe o ha sido eliminado.</p>
      </div>
    )
  }

  const isOwnProfile = user?.profile?.id === id
  const role = profile.user?.role

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <GlassCard className="overflow-hidden mb-6">
        <div className={`h-40 bg-gradient-to-br ${ROLE_BANNER[role] || 'from-[var(--accent)]/25 to-white/[0.02]'} relative`}>
          {profile.bannerUrl && (
            <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
          )}
          {profile.isPremium && (
            <span className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-semibold">
              Premium
            </span>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-[#12121f] bg-[var(--accent)] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.displayName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex gap-2">
              {isOwnProfile ? (
                <div className="flex gap-2">
                  {role === 'BAND' && profile.band?.id && (
                    <button
                      onClick={() => router.push(`/bands/${profile.band.id}/manage`)}
                      className="flex items-center gap-1.5 glass hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 active:scale-95 text-sm px-4 py-2 rounded-lg transition-all"
                    >
                      <Settings size={14} />
                      Gestionar
                    </button>
                  )}
                  <button
                    onClick={() => router.push('/settings/profile')}
                    className="flex items-center gap-1.5 glass hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 active:scale-95 text-sm px-4 py-2 rounded-lg transition-all"
                  >
                    <Edit3 size={14} />
                    Editar perfil
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleContact}
                  disabled={messaging}
                  className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  <MessageCircle size={14} />
                  {messaging ? 'Enviando...' : 'Contactar'}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <span className="text-xs glass px-2 py-0.5 rounded-full text-gray-400">
                {ROLE_LABELS[role] || role}
              </span>
              {avgRating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium">
                  <Star size={12} className="fill-yellow-400" />
                  {avgRating.toFixed(1)}
                  <span className="text-gray-500">({reviews.length})</span>
                </span>
              )}
            </div>
            {profile.city && (
              <p className="flex items-center gap-1 text-gray-400 text-sm">
                <MapPin size={13} />
                {profile.city}{profile.country !== 'ES' ? `, ${profile.country}` : ''}
              </p>
            )}
          </div>

          {profile.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.genres.map((g: string) => (
                <span key={g} className="bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 px-3 py-1 rounded-full text-sm">
                  {g}
                </span>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="text-gray-300 mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(profile.socialLinks).map(([platform, handle]) => {
                const Icon = SOCIAL_ICONS[platform] || Link2
                return (
                  <span
                    key={platform}
                    className="flex items-center gap-1.5 text-sm text-gray-400 glass px-3 py-1.5 rounded-lg"
                  >
                    <Icon size={13} />
                    <span>{String(handle)}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: role-specific info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {role === 'MUSICIAN' && profile.musician && (
            <GlassCard className="p-5">
              <h2 className="font-semibold mb-3">Instrumentos</h2>
              {profile.musician.instruments?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.musician.instruments.map((i: string) => (
                    <span key={i} className="bg-white/[0.05] px-3 py-1 rounded-full text-sm">{i}</span>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">Sin especificar</p>}
              {profile.musician.yearsExperience && (
                <p className="flex items-center gap-1.5 text-gray-400 text-sm mt-3">
                  <GraduationCap size={13} />
                  {profile.musician.yearsExperience} años de experiencia
                </p>
              )}
              {profile.musician.lookingForBand && (
                <p className="flex items-center gap-1.5 text-green-400 text-sm mt-2 font-medium">
                  <CheckCircle2 size={13} />
                  Busca banda
                </p>
              )}
              {profile.musician.openToCollabs && (
                <p className="flex items-center gap-1.5 text-blue-400 text-sm mt-1">
                  <Handshake size={13} />
                  Abierto a colaboraciones
                </p>
              )}
            </GlassCard>
          )}

          {role === 'BAND' && profile.band && (
            <GlassCard className="p-5">
              <h2 className="font-semibold mb-3">Banda</h2>
              {profile.band.lookingForMembers && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                  <p className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                    <CheckCircle2 size={13} />
                    Busca miembros
                  </p>
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
                  <p className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                    <Users size={13} />
                    Miembros ({profile.band.members.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {profile.band.members.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs text-white font-medium overflow-hidden shrink-0">
                          {m.user?.profile?.avatarUrl
                            ? <img src={m.user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            : m.user?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="flex-1">{m.user?.profile?.displayName}</span>
                        <span className="text-gray-500">{m.role === 'ADMIN' ? 'Admin' : 'Miembro'}</span>
                        {isOwnProfile && m.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleKick(m.userId)}
                            className="text-red-400/60 hover:text-red-400 transition-colors ml-1"
                            title="Expulsar"
                          >
                            <UserMinus size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {isOwnProfile && role === 'BAND' && (
                <form onSubmit={handleInvite} className="mt-3 flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Email del músico..."
                    className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="flex items-center gap-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <UserPlus size={13} />
                  </button>
                </form>
              )}
            </GlassCard>
          )}

          {role === 'VENUE' && profile.venue && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-[var(--accent)]" />
                <h2 className="font-semibold">Sala</h2>
              </div>
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
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-400">Dirección</span>
                    <span className="text-right text-xs">{profile.venue.address}</span>
                  </div>
                )}
              </div>
              {profile.venue.amenities?.length > 0 && (
                <div className="mt-3">
                  <p className="text-gray-400 text-xs mb-2">Equipamiento</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.venue.amenities.map((a: string) => (
                      <span key={a} className="bg-white/[0.05] text-xs px-2 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {!isOwnProfile && (
                <button
                  onClick={() => router.push(`/venues/${profile.venue.id}/book`)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  <CalendarDays size={14} />
                  Reservar sala
                </button>
              )}
            </GlassCard>
          )}

          {role === 'PROMOTER' && profile.promoter && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone size={16} className="text-[var(--accent)]" />
                <h2 className="font-semibold">Promotor</h2>
              </div>
              {profile.promoter.eventTypes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.promoter.eventTypes.map((t: string) => (
                    <span key={t} className="bg-white/[0.05] px-3 py-1 rounded-full text-sm">{t}</span>
                  ))}
                </div>
              )}
              {profile.promoter.website && (
                <p className="flex items-center gap-1.5 text-[var(--accent)] text-sm mt-3">
                  <Globe size={13} />
                  {profile.promoter.website}
                </p>
              )}
            </GlassCard>
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
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Film size={16} className="text-[var(--accent)]" />
                  <h2 className="font-semibold">Fotos y vídeos</h2>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    {uploading ? 'Subiendo...' : 'Subir media'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.media.map((m: any) => (
                  <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] relative group">
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
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-10 text-center text-gray-500">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <Film size={22} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium">Sin fotos ni vídeos todavía</p>
              {isOwnProfile && (
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-3 flex items-center gap-1.5 text-[var(--accent)] text-sm hover:underline disabled:opacity-50 mx-auto"
                >
                  <Plus size={14} />
                  {uploading ? 'Subiendo...' : 'Subir media'}
                </button>
              )}
            </GlassCard>
          )}
        </div>
      </div>

      {/* Reviews */}
      <GlassCard className="p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            <h2 className="font-semibold">Reseñas</h2>
            {avgRating > 0 && (
              <span className="text-sm text-yellow-400 font-medium">
                {avgRating.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {user && !isOwnProfile && (
          <form onSubmit={submitReview} className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <p className="text-sm text-gray-400 mb-3">Tu valoración</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setMyRating(star)}
                  className={`transition-colors ${star <= myRating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}
                >
                  <Star size={22} className={star <= myRating ? 'fill-yellow-400' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={myReviewBody}
              onChange={e => setMyReviewBody(e.target.value)}
              placeholder="Comparte tu experiencia (opcional)..."
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-gray-600 resize-none mb-3"
            />
            <button
              type="submit"
              disabled={!myRating || submittingReview}
              className="btn-primary-glow px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:transform-none"
            >
              {submittingReview ? 'Guardando...' : 'Enviar reseña'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Sin reseñas todavía
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map(r => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-xs font-bold shrink-0">
                  {r.reviewer?.profile?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{r.reviewer?.profile?.displayName || 'Usuario'}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-gray-400">{r.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
