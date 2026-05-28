'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Music2, MapPin, Settings, UserPlus, UserMinus, LogOut, Crown } from 'lucide-react'

interface Member {
  userId: string
  role: 'ADMIN' | 'MEMBER'
  status: 'ACTIVE' | 'PENDING'
  joinedAt: string | null
  user: { id: string; profile: { id: string; displayName: string; avatarUrl: string | null; city: string } | null }
}

interface Band {
  id: string
  name: string | null
  description: string | null
  genres: string[]
  city: string | null
  avatarUrl: string | null
  ownerUserId: string | null
  members: Member[]
}

export default function BandPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const [band, setBand] = useState<Band | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Band>(`/api/bands/${id}`)
      .then(setBand)
      .catch(() => setBand(null))
      .finally(() => setLoading(false))
  }, [id])

  const myMembership = band?.members.find(m => m.userId === user?.id)
  const isAdmin = myMembership?.role === 'ADMIN'

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await api.post(`/api/bands/${id}/invite`, { email: inviteEmail })
      toast('Invitación enviada', 'success')
      setInviteEmail('')
    } catch (err: any) {
      toast(err?.error ?? 'Error al invitar', 'error')
    } finally {
      setInviting(false)
    }
  }

  const kick = async (targetUserId: string, name: string) => {
    if (!confirm(`¿Expulsar a ${name}?`)) return
    try {
      await api.delete(`/api/bands/${id}/members/${targetUserId}`)
      setBand(b => b ? { ...b, members: b.members.filter(m => m.userId !== targetUserId) } : b)
      toast(`${name} expulsado`, 'success')
    } catch (err: any) {
      toast(err?.error ?? 'Error', 'error')
    }
  }

  const leave = async () => {
    if (!confirm('¿Salir de la banda?')) return
    try {
      await api.post(`/api/bands/${id}/leave`, {})
      toast('Saliste de la banda', 'info')
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast(err?.error ?? 'Error', 'error')
    }
  }

  if (loading) return <div className="flex justify-center py-20 text-gray-500 text-sm">Cargando...</div>
  if (!band) return <div className="flex justify-center py-20 text-gray-500 text-sm">Banda no encontrada</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-8 pb-8 border-b border-[var(--border)]">
        <div className="w-16 h-16 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {band.avatarUrl
            ? <img src={band.avatarUrl} alt={band.name ?? ''} className="w-full h-full object-cover" />
            : <Music2 size={24} className="text-[var(--text-muted)]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.5rem] font-bold mb-1">
            <span className="gradient-text">{band.name}</span>
          </h1>
          <div className="flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
            {band.city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {band.city}
              </span>
            )}
            {band.genres.length > 0 && (
              <>
                <span>·</span>
                <span>{band.genres.join(', ')}</span>
              </>
            )}
          </div>
        </div>
        {isAdmin && (
          <Link href={`/bands/${band.id}/manage`} className="btn-ghost px-4 py-2 text-[13px] flex-shrink-0 flex items-center gap-1.5">
            <Settings size={14} />
            Gestionar
          </Link>
        )}
      </div>
      {myMembership && (
        <div className="flex justify-end mb-4">
          <button onClick={leave} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-[var(--surface-raised)] px-3 py-1.5 rounded-lg transition-all">
            <LogOut size={14} />
            Salir
          </button>
        </div>
      )}

      {band.description && (
        <p className="text-gray-400 text-sm leading-relaxed mb-8">{band.description}</p>
      )}

      {/* Members */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Miembros ({band.members.length})</h2>
        <div className="space-y-2">
          {band.members.map(m => {
            const name = m.user.profile?.displayName ?? '—'
            const profileId = m.user.profile?.id
            return (
              <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {profileId
                    ? <Link href={`/profiles/${profileId}`} className="text-sm font-medium hover:text-[var(--accent)] transition-colors">{name}</Link>
                    : <span className="text-sm font-medium">{name}</span>}
                  {m.user.profile?.city && <p className="text-xs text-gray-500">{m.user.profile.city}</p>}
                </div>
                {m.role === 'ADMIN' && <Crown size={14} className="text-yellow-400 flex-shrink-0" />}
                {isAdmin && m.userId !== user?.id && (
                  <button onClick={() => kick(m.userId, name)} className="text-gray-600 hover:text-red-400 transition-colors ml-1">
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite */}
      {isAdmin && (
        <div className="border border-[var(--border)] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <UserPlus size={14} className="text-[var(--accent)]" />
            Invitar músico por email
          </h2>
          <form onSubmit={invite} className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              type="email"
              placeholder="email@ejemplo.com"
              className="flex-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--accent)]/50"
            />
            <button
              type="submit"
              disabled={inviting}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {inviting ? '...' : 'Invitar'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
