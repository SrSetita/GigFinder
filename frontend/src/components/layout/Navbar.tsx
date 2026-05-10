'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'

export default function Navbar() {
  const { user, loading, logout } = useAuth()

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]">
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[var(--accent)] flex-shrink-0">
          GigFinder
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/search?type=venue"    className="text-gray-400 hover:text-white transition-colors">Salas</Link>
          <Link href="/search?type=band"     className="text-gray-400 hover:text-white transition-colors">Bandas</Link>
          <Link href="/search?type=musician" className="text-gray-400 hover:text-white transition-colors">Músicos</Link>
          <Link href="/search?type=promoter" className="text-gray-400 hover:text-white transition-colors">Promotores</Link>
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <Link href="/messages" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm">Mensajes</Link>
              {user.role === 'VENUE' ? (
                <Link href="/venues/manage" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm">Mi sala</Link>
              ) : (
                <Link href="/bookings" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm">Mis solicitudes</Link>
              )}
              <Link href={`/profiles/${user.profile?.id}`} className="flex items-center hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-xs">
                  {user.profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button onClick={logout} className="hidden md:block text-gray-500 hover:text-red-400 transition-colors text-sm">Salir</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors text-sm">Entrar</Link>
              <Link href="/auth/register" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile second row — horizontal scroll */}
      <div className="md:hidden flex gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
        <Link href="/search?type=venue"    className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Salas</Link>
        <Link href="/search?type=band"     className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Bandas</Link>
        <Link href="/search?type=musician" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Músicos</Link>
        <Link href="/search?type=promoter" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Promotores</Link>
        {!loading && user && (
          <>
            <Link href="/messages" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Mensajes</Link>
            {user.role === 'VENUE' ? (
              <Link href="/venues/manage" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Mi sala</Link>
            ) : (
              <Link href="/bookings" className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-[var(--muted)] hover:bg-[var(--accent)]/20 px-3 py-1.5 rounded-full transition-colors">Mis solicitudes</Link>
            )}
            <button onClick={logout} className="flex-shrink-0 text-xs text-red-400 bg-[var(--muted)] px-3 py-1.5 rounded-full transition-colors">Salir</button>
          </>
        )}
      </div>
    </nav>
  )
}
