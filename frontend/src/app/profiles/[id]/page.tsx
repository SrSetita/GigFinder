'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  MapPin, GraduationCap, CheckCircle2, Handshake, Users, Film,
  Plus, X, Building2,
  Camera, Play, Globe, Music2, Radio, AtSign, Link2,
  CalendarDays, Megaphone, Star, UserPlus, UserMinus,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Card from '@/components/ui/Card'
import DropZone from '@/components/ui/DropZone'
import { useToast } from '@/lib/ToastContext'
import { SkeletonProfile } from '@/components/ui/Skeleton'

const ROLE_LABELS: Record<string, string> = {
  MUSICIAN: 'Músico',
  BAND:     'Banda',
  VENUE:    'Sala de ensayo',
  PROMOTER: 'Promotor',
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
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [profileNotFound, setProfileNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [myRating, setMyRating] = useState(0)
  const [myReviewBody, setMyReviewBody] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const savedToastShown = useRef(false)

  const savedParam = searchParams.get('saved')
  useEffect(() => {
    if (savedParam === '1' && !savedToastShown.current) {
      savedToastShown.current = true
      toast('Cambios guardados correctamente', 'success')
    }
  }, [savedParam])

  useEffect(() => {
    api.get<any>(`/api/profiles/${id}`)
      .then(setProfile)
      .catch((err: any) => {
        setProfile(null)
        if (err?.status && err.status !== 404) {
          setProfileNotFound(true)
        }
      })
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

  const uploadMediaFile = async (file: File) => {
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

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadMediaFile(file)
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (confirmDeleteId !== mediaId) { setConfirmDeleteId(mediaId); return }
    setConfirmDeleteId(null)
    try {
      await api.delete(`/api/upload/media/${mediaId}`)
      setProfile((prev: any) => ({ ...prev, media: prev.media.filter((m: any) => m.id !== mediaId) }))
      toast('Eliminado', 'success')
    } catch (e: any) {
      toast(e?.error || e?.message || 'Error al eliminar', 'error')
    }
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
        <Card className="overflow-hidden mb-6">
          <SkeletonProfile />
        </Card>
      </div>
    )
  }

  if (!profile) {
    if (!profileNotFound) {
      const isOwnStale = !authLoading && String(user?.profile?.id) === id
      if (isOwnStale) {
        router.replace('/settings/profile')
        return null
      }
    }
    return (
      <div className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
          <Users size={24} className="text-[var(--text-muted)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-[var(--text-muted)]">Este perfil no existe o ha sido eliminado.</p>
      </div>
    )
  }

  const isOwnProfile = !authLoading && String(user?.profile?.id) === id
  const role = profile.user?.role

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* ── Header card ── */}
      <div className="mb-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
        {/* Banner — top of card */}
        <div className="h-44 overflow-hidden rounded-t-2xl">
          {profile.bannerUrl
            ? <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(232,121,249,0.1) 100%)' }} />
          }
        </div>

        {/* Card body */}
        <div className="px-5 pb-5 pt-2">
          {/* Avatar + action button */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="w-20 h-20 rounded-full bg-[var(--surface)] border-[3px] border-[var(--background)] overflow-hidden flex-shrink-0 relative z-10">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--text-muted)]">
                    {profile.displayName?.[0]?.toUpperCase()}
                  </div>
              }
            </div>
            <div className="pb-1">
              {isOwnProfile ? (
                <Link href="/settings/profile" className="btn-ghost px-4 py-2 text-[13px]">
                  Editar perfil
                </Link>
              ) : (
                <button onClick={handleContact} disabled={messaging} className="btn-primary px-4 py-2 text-[13px]">
                  {messaging ? 'Enviando...' : 'Contactar'}
                </button>
              )}
            </div>
          </div>

          {/* Nombre + rol + ciudad */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[1.5rem] font-bold">
                <span className="gradient-text">{profile.displayName}</span>
              </h1>
              {profile.verified && <CheckCircle2 size={16} className="text-[var(--accent)]" />}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
              {role && <span>{ROLE_LABELS[role]}</span>}
              {profile.city && (
                <>
                  {role && <span>·</span>}
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {profile.city}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Géneros (floating pills) ── */}
      {profile.genres?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.genres.map((g: string) => (
            <span key={g} className="genre-pill px-3 py-1 rounded-full text-[12px]">{g}</span>
          ))}
        </div>
      )}

      {/* ── Bio / redes ── */}
      {(profile.bio || (profile.socialLinks && Object.keys(profile.socialLinks).length > 0)) && (
        <Card className="p-5 mb-6">
          {profile.bio && (
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">{profile.bio}</p>
          )}
          {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.socialLinks).map(([platform, handle]) => {
                const Icon = SOCIAL_ICONS[platform] || Link2
                return (
                  <span key={platform} className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-1.5 rounded-lg">
                    <Icon size={12} />
                    {handle as string}
                  </span>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: role-specific info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          {role === 'MUSICIAN' && profile.musician && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3">Instrumentos</h2>
              {profile.musician.instruments?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.musician.instruments.map((i: string) => (
                    <span key={i} className="bg-[var(--surface-raised)] px-3 py-1 rounded-full text-sm">{i}</span>
                  ))}
                </div>
              ) : <p className="text-[var(--text-secondary)] text-sm">Sin especificar</p>}
              {profile.musician.yearsExperience && (
                <p className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm mt-3">
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
            </Card>
          )}

          {role === 'BAND' && profile.band && (
            <Card className="p-5">
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
                  <p className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-2">
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
                        <span className="text-[var(--text-muted)]">{m.role === 'ADMIN' ? 'Admin' : 'Miembro'}</span>
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
                    className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)]"
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
            </Card>
          )}

          {role === 'VENUE' && profile.venue && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-[var(--accent)]" />
                <h2 className="font-semibold">Sala</h2>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Precio/hora</span>
                  <span className="font-semibold text-green-400">{parseFloat(profile.venue.hourlyRate).toFixed(0)}€</span>
                </div>
                {profile.venue.capacity && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Capacidad</span>
                    <span>{profile.venue.capacity} personas</span>
                  </div>
                )}
                {profile.venue.address && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--text-secondary)]">Dirección</span>
                    <span className="text-right text-xs">{profile.venue.address}</span>
                  </div>
                )}
              </div>
              {profile.venue.amenities?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[var(--text-secondary)] text-xs mb-2">Equipamiento</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.venue.amenities.map((a: string) => (
                      <span key={a} className="bg-[var(--surface-raised)] text-xs px-2 py-1 rounded-full">{a}</span>
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
            </Card>
          )}

          {role === 'PROMOTER' && profile.promoter && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone size={16} className="text-[var(--accent)]" />
                <h2 className="font-semibold">Promotor</h2>
              </div>
              {profile.promoter.eventTypes?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.promoter.eventTypes.map((t: string) => (
                    <span key={t} className="bg-[var(--surface-raised)] px-3 py-1 rounded-full text-sm">{t}</span>
                  ))}
                </div>
              )}
              {profile.promoter.website && (
                <p className="flex items-center gap-1.5 text-[var(--accent)] text-sm mt-3">
                  <Globe size={13} />
                  {profile.promoter.website}
                </p>
              )}
            </Card>
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
          <DropZone
            onFile={uploadMediaFile}
            accept="image/*,video/*"
            disabled={uploading || !isOwnProfile}
          >
            {profile.media?.length > 0 ? (
              <Card className="p-5">
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
                    <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-[var(--surface)] relative group">
                      {m.type === 'IMAGE' ? (
                        <img src={m.url} alt={m.title || ''} className="w-full h-full object-cover" />
                      ) : m.type === 'VIDEO' ? (
                        <video src={m.url} className="w-full h-full object-cover" controls />
                      ) : null}
                      {isOwnProfile && (
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          className={`absolute top-2 right-2 w-7 h-7 text-white rounded-full text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex items-center justify-center ${confirmDeleteId === m.id ? 'bg-red-600 scale-110' : 'bg-black/70 hover:bg-red-600'}`}
                          title={confirmDeleteId === m.id ? 'Tap again to confirm' : 'Delete'}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-10 text-center text-[var(--text-muted)]">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                  <Film size={22} className="text-[var(--text-muted)]" />
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
              </Card>
            )}
          </DropZone>
        </div>
      </div>

      {/* Reviews */}
      <Card className="p-6 mt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-[var(--rating)]" />
            <h2 className="font-semibold">Reseñas</h2>
            {avgRating > 0 && (
              <span className="text-sm text-[var(--rating)] font-medium">
                {avgRating.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {user && !isOwnProfile && (
          <form onSubmit={submitReview} className="mb-6 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)] mb-3">Tu valoración</p>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setMyRating(star)}
                  className={`transition-colors ${star <= myRating ? 'text-[var(--rating)]' : 'text-[var(--rating-empty)] hover:text-[var(--rating)]'}`}
                >
                  <Star size={22} className={star <= myRating ? 'fill-[var(--rating)]' : ''} />
                </button>
              ))}
            </div>
            <textarea
              value={myReviewBody}
              onChange={e => setMyReviewBody(e.target.value)}
              placeholder="Comparte tu experiencia (opcional)..."
              rows={2}
              className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]/60 transition-colors placeholder:text-[var(--text-muted)] resize-none mb-3"
            />
            <button
              type="submit"
              disabled={!myRating || submittingReview}
              className="btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 disabled:transform-none"
            >
              {submittingReview ? 'Guardando...' : 'Enviar reseña'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
              <Star size={18} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Sin reseñas todavía</p>
            {!isOwnProfile && user && (
              <p className="text-xs text-[var(--text-muted)] mt-1">Sé el primero en valorar este perfil</p>
            )}
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
                        <Star key={s} size={11} className={s <= r.rating ? 'text-[var(--rating)] fill-[var(--rating)]' : 'text-[var(--rating-empty)]'} />
                      ))}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {r.body && <p className="text-sm text-[var(--text-secondary)]">{r.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
