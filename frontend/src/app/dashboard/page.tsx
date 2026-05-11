'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { api } from '@/lib/api'
import { Music2, Plus, MapPin, Users, Check, X, Crown } from 'lucide-react'

interface Member {
  userId: string
  role: 'ADMIN' | 'MEMBER'
  user: { profile: { displayName: string; avatarUrl: string | null } | null }
}

interface Band {
  id: string
  name: string | null
  genres: string[]
  city: string | null
  avatarUrl: string | null
  members: Member[]
}

interface Invitation {
  id: string
  bandId: string
  band: Band & { members: Member[] }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bands, setBands] = useState<Band[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/auth/login'); return }
    Promise.all([
      api.get<Band[]>('/api/bands/mine').catch(() => []),
      api.get<Invitation[]>('/api/bands/invitations').catch(() => []),
    ]).then(([b, inv]) => { setBands(b); setInvitations(inv) })
      .finally(() => setFetching(false))
  }, [user, loading])

  const acceptInvite = async (inv: Invitation) => {
    try {
      await api.post(`/api/bands/${inv.bandId}/accept`, {})
      setInvitations(prev => prev.filter(i => i.id !== inv.id))
      const band = await api.get<Band>(`/api/bands/${inv.bandId}`)
      setBands(prev => [...prev, band])
      toast(`Te uniste a ${inv.band.name}`, 'success')
    } catch (err: any) {
      toast(err?.error ?? 'Error', 'error')
    }
  }

  const declineInvite = async (inv: Invitation) => {
    try {
      await api.post(`/api/bands/${inv.bandId}/decline`, {})
      setInvitations(prev => prev.filter(i => i.id !== inv.id))
      toast('Invitación rechazada', 'info')
    } catch {
      toast('Error', 'error')
    }
  }

  if (loading || fetching) {
    return <div className="flex justify-center py-20 text-gray-500 text-sm">Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mis bandas</h1>
        <Link
          href="/bands/create"
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Nueva banda
        </Link>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">Invitaciones pendientes</h2>
          <div className="space-y-3">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                  <Music2 size={18} className="text-[var(--accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{inv.band.name}</p>
                  <p className="text-xs text-gray-500">{inv.band.members.length} miembro{inv.band.members.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(inv)}
                    className="flex items-center gap-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Check size={12} />
                    Unirme
                  </button>
                  <button
                    onClick={() => declineInvite(inv)}
                    className="flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bands list */}
      {bands.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.1] rounded-2xl">
          <Music2 size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No perteneces a ninguna banda todavía</p>
          <Link href="/bands/create" className="text-[var(--accent)] hover:underline text-sm">
            Crear mi primera banda
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bands.map(band => {
            const myRole = band.members.find(m => m.userId === user?.id)?.role
            return (
              <Link
                key={band.id}
                href={`/bands/${band.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--accent)]/20 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center flex-shrink-0">
                  {band.avatarUrl
                    ? <img src={band.avatarUrl} className="w-full h-full rounded-xl object-cover" />
                    : <Music2 size={22} className="text-[var(--accent)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{band.name}</span>
                    {myRole === 'ADMIN' && <Crown size={12} className="text-yellow-400" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {band.city && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{band.city}</span>}
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={10} />{band.members.length}</span>
                  </div>
                  {band.genres.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {band.genres.slice(0, 3).map(g => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
