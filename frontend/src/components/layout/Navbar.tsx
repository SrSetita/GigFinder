'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { LogOut, User } from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'

const NAV_LINKS = [
  { href: '/search?type=venue',    label: 'Salas' },
  { href: '/search?type=band',     label: 'Bandas' },
  { href: '/search?type=musician', label: 'Músicos' },
  { href: '/search?type=promoter', label: 'Promotores' },
  { href: '/gigs',                 label: 'Tablón' },
]

export default function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-[200] border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-[15px] font-black tracking-tight">
            Gig<span className="text-[var(--accent)]">Finder</span>
          </span>
        </Link>

        {/* Nav links — solo desktop */}
        <div className="hidden md:flex items-center gap-0.5 text-[13px]">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors duration-150"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Acciones — solo desktop */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/messages"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors duration-150 text-[13px]"
              >
                Mensajes
              </Link>
              <Link
                href={user.role === 'VENUE' ? '/venues/manage' : '/dashboard'}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors duration-150 text-[13px]"
              >
                {user.role === 'VENUE' ? 'Mi sala' : 'Mis bandas'}
              </Link>
              <Link
                href="/bookings"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition-colors duration-150 text-[13px]"
              >
                Solicitudes
              </Link>
              <NotificationBell />
              <Link
                href={`/profiles/${user.profile?.id}`}
                className="w-7 h-7 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--border-hover)] transition-colors"
              >
                {user.profile?.avatarUrl
                  ? <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <User size={13} className="text-[var(--text-secondary)]" />
                }
              </Link>
              <button
                onClick={logout}
                className="text-[var(--text-muted)] hover:text-red-400 p-1.5 rounded-lg transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[13px] px-3 py-1.5 rounded-lg transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary text-[13px] px-4 py-1.5"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Mobile: solo logo + avatar/login */}
        <div className="md:hidden flex items-center gap-2">
          {!loading && user && (
            <>
              <NotificationBell />
              <Link
                href={`/profiles/${user.profile?.id}`}
                className="w-7 h-7 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center overflow-hidden"
              >
                {user.profile?.avatarUrl
                  ? <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <User size={13} className="text-[var(--text-secondary)]" />
                }
              </Link>
            </>
          )}
          {!loading && !user && (
            <Link href="/auth/login" className="btn-primary text-[13px] px-4 py-1.5">
              Entrar
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}
