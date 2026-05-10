'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

const NAV_LINKS = [
  { href: '/search?type=venue',    label: 'Salas' },
  { href: '/search?type=band',     label: 'Bandas' },
  { href: '/search?type=musician', label: 'Músicos' },
  { href: '/search?type=promoter', label: 'Promotores' },
]

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)] px-4 md:px-6 py-4 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[var(--accent)] flex-shrink-0">
          GigFinder
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <Link href="/messages" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Mensajes
                </Link>
                {user.role === 'VENUE' ? (
                  <Link href="/venues/manage" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Mi sala
                  </Link>
                ) : (
                  <Link href="/bookings" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Mis solicitudes
                  </Link>
                )}
                <Link href={`/profiles/${user.profile?.id}`} className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-xs">
                    {user.profile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors text-sm">
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Entrar
                </Link>
                <Link href="/auth/register" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile: avatar or login + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && user && (
              <Link href={`/profiles/${user.profile?.id}`} className="hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-xs">
                  {user.profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            )}
            {!loading && !user && (
              <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Entrar
              </Link>
            )}
            <button
              onClick={() => setOpen(!open)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Menú"
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden fixed top-[65px] left-0 right-0 bg-[var(--card)] border-b border-[var(--border)] px-4 py-4 flex flex-col gap-1 shadow-xl z-50">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-[var(--muted)] px-3 py-2.5 rounded-lg transition-colors text-sm"
            >
              {l.label}
            </Link>
          ))}
          {!loading && user && (
            <>
              <div className="border-t border-[var(--border)] my-2" />
              <Link href="/messages" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white hover:bg-[var(--muted)] px-3 py-2.5 rounded-lg transition-colors text-sm">
                Mensajes
              </Link>
              {user.role === 'VENUE' ? (
                <Link href="/venues/manage" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white hover:bg-[var(--muted)] px-3 py-2.5 rounded-lg transition-colors text-sm">
                  Mi sala
                </Link>
              ) : (
                <Link href="/bookings" onClick={() => setOpen(false)} className="text-gray-300 hover:text-white hover:bg-[var(--muted)] px-3 py-2.5 rounded-lg transition-colors text-sm">
                  Mis solicitudes
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); logout() }}
                className="text-left text-red-400 hover:bg-[var(--muted)] px-3 py-2.5 rounded-lg transition-colors text-sm"
              >
                Cerrar sesión
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <div className="border-t border-[var(--border)] my-2" />
              <Link href="/auth/register" onClick={() => setOpen(false)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-2.5 rounded-lg transition-colors text-sm text-center font-medium">
                Registrarse
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
