'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { api } from '@/lib/api'
import { Music2, Plus, ArrowRight } from 'lucide-react'

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

      {/* ── Invitaciones pendientes ── */}
      {invitations.length > 0 && (
        <div className="mb-6 border border-[var(--accent)]/30 bg-[var(--accent-subtle)] rounded-xl p-4">
          <p className="text-[13px] font-semibold text-[var(--accent)] mb-3">
            {invitations.length} invitación{invitations.length > 1 ? 'es' : ''} pendiente{invitations.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-col gap-2">
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[var(--text-primary)]">{inv.band.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => acceptInvite(inv)} className="btn-primary px-3 py-1.5 text-[12px]">
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mis bandas ── */}
      {bands.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.1] rounded-2xl">
          <Music2 size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No perteneces a ninguna banda todavía</p>
          <Link href="/bands/create" className="text-[var(--accent)] hover:underline text-sm">
            Crear mi primera banda
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
          {bands.map(band => (
            <Link
              key={band.id}
              href={`/bands/${band.id}`}
              className="flex items-center gap-4 px-4 py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors duration-150"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {band.avatarUrl
                  ? <img src={band.avatarUrl} alt={band.name ?? ''} className="w-full h-full object-cover" />
                  : <Music2 size={16} className="text-[var(--text-muted)]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] truncate">{band.name}</div>
                <div className="text-[12px] text-[var(--text-muted)] truncate">
                  {band.city && `${band.city} · `}{band.members.length} miembro{band.members.length !== 1 ? 's' : ''}
                </div>
              </div>
              <ArrowRight size={15} className="text-[var(--text-muted)] flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
