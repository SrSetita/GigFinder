'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Play, Globe, Music2, Radio, AtSign, Trash2, Upload, Eye, EyeOff, Crown, UserMinus, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import GlassCard from '@/components/ui/GlassCard'
import DropZone from '@/components/ui/DropZone'

const GENRE_OPTIONS = ['Rock', 'Metal', 'Pop', 'Jazz', 'Blues', 'Funk', 'Soul', 'R&B', 'Hip-Hop', 'Electrónica', 'Indie', 'Punk', 'Folk', 'Clásica', 'Reggae', 'Latin', 'Flamenco', 'Country', 'Experimental', 'Ambient']
const WANTED_ROLES = ['Guitarra', 'Bajo', 'Batería', 'Teclado', 'Voz', 'Saxofón', 'Trompeta', 'Trombón', 'Otro']
const SOCIAL_PLATFORMS = ['instagram', 'spotify', 'youtube', 'soundcloud', 'twitter', 'facebook', 'web', 'bandcamp']

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: Camera, spotify: Music2, youtube: Play, soundcloud: Radio,
  twitter: AtSign, facebook: Globe, web: Globe, bandcamp: Globe,
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${on ? 'bg-[var(--accent)]' : 'bg-[var(--muted)]'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${on ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  )
}

function ChipSelector({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${selected.includes(o) ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-white/[0.07] text-gray-400 hover:border-[var(--accent)]/40 hover:text-white'}`}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function BandManagePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [band, setBand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({})
  const [isPublic, setIsPublic] = useState(true)
  const [lookingForMembers, setLookingForMembers] = useState(false)
  const [wantedRoles, setWantedRoles] = useState<string[]>([])

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return }
    api.get<any>(`/api/bands/${id}`)
      .then(b => {
        const myRole = b.members?.find((m: any) => m.userId === user.id)?.role
        if (myRole !== 'ADMIN') { router.replace(`/bands/${id}`); return }
        setBand(b)
        setName(b.name ?? '')
        setDescription(b.description ?? '')
        setCity(b.city ?? '')
        setGenres(b.genres ?? [])
        setSocialLinks((b.socialLinks as Record<string, string>) ?? {})
        setIsPublic(b.isPublic ?? true)
        setLookingForMembers(b.lookingForMembers ?? false)
        setWantedRoles(b.wantedRoles ?? [])
        setAvatarPreview(b.avatarUrl ?? null)
        setBannerPreview(b.bannerUrl ?? null)
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false))
  }, [user, id, router])

  const uploadFile = async (file: File, endpoint: string): Promise<any> => {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('gf_token')
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ''}${endpoint}`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form }
    )
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  }

  const handleAvatarFile = async (file: File) => {
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const data = await uploadFile(file, `/api/upload/band/${id}/avatar`)
      setAvatarPreview(data.url)
      toast('Avatar actualizado', 'success')
    } catch {
      setAvatarPreview(band?.avatarUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingAvatar(false) }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await handleAvatarFile(file)
  }

  const handleBannerFile = async (file: File) => {
    setBannerPreview(URL.createObjectURL(file))
    setUploadingBanner(true)
    try {
      const data = await uploadFile(file, `/api/upload/band/${id}/banner`)
      setBannerPreview(data.url)
      toast('Banner actualizado', 'success')
    } catch {
      setBannerPreview(band?.bannerUrl ?? null)
      toast('Error al subir imagen', 'error')
    }
    finally { setUploadingBanner(false) }
  }

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await handleBannerFile(file)
  }

  const handleMediaFile = async (file: File) => {
    setUploadingMedia(true)
    try {
      const media = await uploadFile(file, `/api/upload/band/${id}/media`)
      setBand((b: any) => ({ ...b, media: [...(b.media ?? []), media] }))
      toast('Archivo subido', 'success')
    } catch { toast('Error al subir archivo', 'error') }
    finally { setUploadingMedia(false); if (mediaRef.current) mediaRef.current.value = '' }
  }

  const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await handleMediaFile(file)
  }

  const deleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/api/upload/band/${id}/media/${mediaId}`)
      setBand((b: any) => ({ ...b, media: b.media.filter((m: any) => m.id !== mediaId) }))
      toast('Eliminado', 'success')
    } catch { toast('Error al eliminar', 'error') }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/api/bands/${id}`, { name, description, city, genres, socialLinks, isPublic, lookingForMembers, wantedRoles })
      toast('Cambios guardados', 'success')
      router.push(`/bands/${id}`)
    } catch (err: any) { toast(err?.error ?? 'Error al guardar', 'error') }
    finally { setSaving(false) }
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await api.post(`/api/bands/${id}/invite`, { email: inviteEmail })
      toast('Invitación enviada', 'success')
      setInviteEmail('')
    } catch (err: any) { toast(err?.error ?? 'Error al invitar', 'error') }
    finally { setInviting(false) }
  }

  const kick = async (userId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name}?`)) return
    try {
      await api.delete(`/api/bands/${id}/members/${userId}`)
      setBand((b: any) => ({ ...b, members: b.members.filter((m: any) => m.userId !== userId) }))
      toast(`${name} expulsado`, 'success')
    } catch (err: any) { toast(err?.error ?? 'Error', 'error') }
  }

  const promoteAdmin = async (userId: string) => {
    try {
      await api.patch(`/api/bands/${id}/members/${userId}/role`, { role: 'ADMIN' })
      setBand((b: any) => ({ ...b, members: b.members.map((m: any) => m.userId === userId ? { ...m, role: 'ADMIN' } : m) }))
      toast('Ascendido a admin', 'success')
    } catch { toast('Error', 'error') }
  }

  const updateSocialLink = (p: string, v: string) =>
    setSocialLinks(prev => v ? { ...prev, [p]: v } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== p)))

  if (loading) return <div className="flex justify-center py-20 text-gray-500 text-sm">Cargando...</div>

  const activeMembers = band?.members?.filter((m: any) => m.status === 'ACTIVE') ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/bands/${id}`} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} />
          Volver a la banda
        </Link>
        <h1 className="text-2xl font-bold">Gestionar banda</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Banner + Avatar */}
        <GlassCard className="overflow-hidden">
          <DropZone onFile={handleBannerFile} accept="image/*" disabled={uploadingBanner} className="block">
            <div className="h-36 bg-gradient-to-br from-[var(--accent)]/25 to-white/[0.02] relative cursor-pointer group"
              onClick={() => bannerRef.current?.click()}>
              {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-2 text-white text-sm font-medium">
                  <Camera size={16} />
                  {uploadingBanner ? 'Subiendo...' : 'Cambiar banner'}
                </span>
              </div>
              <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
            </div>
          </DropZone>
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4 relative z-10">
              <DropZone onFile={handleAvatarFile} accept="image/*" disabled={uploadingAvatar}>
                <div className="w-20 h-20 rounded-2xl border-4 border-[#12121f] bg-[var(--accent)]/20 flex items-center justify-center text-2xl font-bold text-white overflow-hidden cursor-pointer relative group flex-shrink-0"
                  onClick={() => avatarRef.current?.click()}>
                  {avatarPreview
                    ? <img src={avatarPreview} className="w-full h-full object-cover" />
                    : <Music2 size={28} className="text-[var(--accent)]" />}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <Camera size={16} className="text-white" />
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                </div>
              </DropZone>
              <p className="text-xs text-gray-500 pb-1">Clic para cambiar avatar o banner</p>
            </div>
          </div>
        </GlassCard>

        {/* Visibilidad */}
        <GlassCard className="p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Visibilidad</h2>
          <Toggle on={isPublic} onToggle={() => setIsPublic(v => !v)}
            label={isPublic ? 'Perfil público — visible para todos' : 'Perfil privado — solo miembros'} />
          {!isPublic && (
            <p className="text-xs text-gray-500">El perfil no aparecerá en búsquedas ni será accesible sin invitación.</p>
          )}
        </GlassCard>

        {/* Info básica */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Información básica</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} required maxLength={80}
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={1000}
              placeholder="Historia, estilo, lo que os define..."
              className="w-full bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none" />
            <p className="text-xs text-gray-600 mt-1 text-right">{description.length}/1000</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Géneros</label>
            <ChipSelector options={GENRE_OPTIONS} selected={genres} onChange={setGenres} />
          </div>
          <Toggle on={lookingForMembers} onToggle={() => setLookingForMembers(v => !v)} label="Buscamos miembros" />
          {lookingForMembers && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Roles que buscamos</label>
              <ChipSelector options={WANTED_ROLES} selected={wantedRoles} onChange={setWantedRoles} />
            </div>
          )}
        </GlassCard>

        {/* Redes */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Redes y plataformas</h2>
          {SOCIAL_PLATFORMS.map(p => {
            const Icon = SOCIAL_ICONS[p] ?? Globe
            return (
              <div key={p} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <input type="text" value={socialLinks[p] ?? ''} onChange={e => updateSocialLink(p, e.target.value)}
                  placeholder={p === 'web' ? 'https://mibanda.com' : p === 'spotify' ? 'URL de artista' : '@usuario o URL'}
                  className="flex-1 bg-white/[0.05] border border-white/[0.07] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-colors" />
              </div>
            )
          })}
        </GlassCard>

        {/* Media */}
        <DropZone onFile={handleMediaFile} accept="image/*,video/*,audio/*" disabled={uploadingMedia}>
          <GlassCard className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Fotos, vídeos y demos</h2>
              <label className={`flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-white cursor-pointer transition-colors ${uploadingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={12} />
                {uploadingMedia ? 'Subiendo...' : 'Subir archivo'}
                <input ref={mediaRef} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={handleMedia} />
              </label>
            </div>
            {(!band?.media || band.media.length === 0) ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin archivos todavía. Sube fotos, vídeos o demos.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {band.media.map((m: any) => (
                  <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden bg-white/[0.05]">
                    {m.type === 'IMAGE'
                      ? <img src={m.url} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Play size={24} />
                          <span className="text-xs absolute bottom-1 left-1 right-1 text-center truncate">{m.title ?? 'Video'}</span>
                        </div>
                    }
                    <button type="button" onClick={() => deleteMedia(m.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                      <Trash2 size={11} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </DropZone>

        {/* Guardar */}
        <div className="flex items-center justify-end gap-3">
          <Link href={`/bands/${id}`} className="text-gray-400 hover:text-white text-sm transition-colors">Cancelar</Link>
          <button type="submit" disabled={saving || uploadingAvatar || uploadingBanner}
            className="btn-primary-glow px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 disabled:transform-none">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* Miembros */}
      <div className="mt-8 flex flex-col gap-6">
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Miembros activos</h2>
          {activeMembers.map((m: any) => {
            const memberName = m.user?.profile?.displayName ?? '—'
            const isMe = m.userId === user?.id
            return (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {memberName[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{memberName} {isMe && <span className="text-xs text-gray-500">(tú)</span>}</p>
                  <p className="text-xs text-gray-500">{m.role === 'ADMIN' ? 'Admin' : 'Miembro'}</p>
                </div>
                {m.role === 'ADMIN' && <Crown size={14} className="text-yellow-400 flex-shrink-0" />}
                {!isMe && (
                  <div className="flex gap-1">
                    {m.role !== 'ADMIN' && (
                      <button type="button" onClick={() => promoteAdmin(m.userId)}
                        title="Hacer admin"
                        className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-yellow-500/20 flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors">
                        <Crown size={12} />
                      </button>
                    )}
                    <button type="button" onClick={() => kick(m.userId, memberName)}
                      className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-red-500/20 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors">
                      <UserMinus size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-semibold text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserPlus size={12} />
            Invitar músico por email
          </h2>
          <form onSubmit={invite} className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--accent)]/50" />
            <button type="submit" disabled={inviting}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {inviting ? '...' : 'Invitar'}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
