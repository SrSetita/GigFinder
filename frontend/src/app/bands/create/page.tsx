'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { useToast } from '@/lib/ToastContext'
import { Music2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const GENRES = ['Rock', 'Metal', 'Jazz', 'Pop', 'Hip-Hop', 'Electrónica', 'Flamenco', 'Indie', 'Folk', 'R&B', 'Clásica', 'Reggae', 'Blues', 'Punk', 'Ska']

export default function CreateBandPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', description: '', city: '', genres: [] as string[] })
  const [submitting, setSubmitting] = useState(false)

  if (!loading && !user) {
    router.replace('/auth/login')
    return null
  }

  const toggleGenre = (g: string) =>
    setForm(f => ({ ...f, genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g] }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast('El nombre es obligatorio', 'error')
    setSubmitting(true)
    try {
      const band = await api.post<{ id: string }>('/api/bands', form)
      toast('Banda creada', 'success')
      router.push(`/bands/${band.id}`)
    } catch (err: any) {
      toast(err?.error ?? 'Error al crear la banda', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft size={14} />
        Mis bandas
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
          <Music2 size={20} className="text-[var(--accent)]" />
        </div>
        <h1 className="text-2xl font-bold">Crear banda</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Nombre *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
            placeholder="Nombre de la banda"
            maxLength={80}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50 resize-none"
            rows={3}
            placeholder="Describe la banda, estilo, historia..."
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Ciudad</label>
          <input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]/50"
            placeholder="Madrid, Barcelona..."
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Géneros</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  form.genres.includes(g)
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'bg-white/[0.04] border-white/[0.1] text-gray-400 hover:border-[var(--accent)]/40'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creando...' : 'Crear banda'}
        </button>
      </form>
    </div>
  )
}
