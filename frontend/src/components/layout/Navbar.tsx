'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { Mail, Building2, CalendarDays, LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="border-b border-white/[0.07] backdrop-blur-md bg-white/[0.03] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0 group">
          <span className="text-xl font-black tracking-tight">
            Gig<span className="text-[var(--accent)] group-hover:text-white transition-colors duration-200" style={{ textShadow: '0 0 20px rgba(124,58,237,0.6)' }}>Finder</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          {[
            { href: '/search?type=venue',    label: 'Salas' },
            { href: '/search?type=band',     label: 'Bandas' },
            { href: '/search?type=musician', label: 'Músicos' },
            { href: '/search?type=promoter', label: 'Promotores' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-gray-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-lg transition-all"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link href="/messages" className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-lg transition-all text-sm">
                <Mail size={14} />
                Mensajes
              </Link>
              {user.role === 'VENUE' ? (
                <Link href="/venues/manage" className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-lg transition-all text-sm">
                  <Building2 size={14} />
                  Mi sala
                </Link>
              ) : (
                <Link href="/bookings" className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] px-3 py-1.5 rounded-lg transition-all text-sm">
                  <CalendarDays size={14} />
                  Solicitudes
                </Link>
              )}
              <Link href={`/profiles/${user.profile?.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-xs">
                  {user.profile?.displayName?.[0]?.toUpperCase() || <User size={14} />}
                </div>
              </Link>
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-1 text-gray-500 hover:text-red-400 hover:bg-red-400/[0.06] px-2 py-1.5 rounded-lg transition-all text-sm"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all">
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
        {[
          { href: '/search?type=venue',    label: 'Salas' },
          { href: '/search?type=band',     label: 'Bandas' },
          { href: '/search?type=musician', label: 'Músicos' },
          { href: '/search?type=promoter', label: 'Promotores' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-white/[0.05] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors"
          >
            {label}
          </Link>
        ))}
        {!loading && user && (
          <>
            <Link href="/messages" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-white/[0.05] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">
              Mensajes
            </Link>
            {user.role === 'VENUE' ? (
              <Link href="/venues/manage" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-white/[0.05] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">
                Mi sala
              </Link>
            ) : (
              <Link href="/bookings" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-white/[0.05] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">
                Solicitudes
              </Link>
            )}
            <button
              onClick={logout}
              className="flex-shrink-0 text-xs text-red-400 bg-white/[0.05] px-3 py-1.5 rounded-full transition-colors"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
