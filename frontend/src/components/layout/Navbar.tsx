'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[var(--accent)]">
          GigFinder
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/search?type=venue" className="text-gray-400 hover:text-white transition-colors">
            Salas
          </Link>
          <Link href="/search?type=band" className="text-gray-400 hover:text-white transition-colors">
            Bandas
          </Link>
          <Link href="/search?type=musician" className="text-gray-400 hover:text-white transition-colors">
            Músicos
          </Link>
          <Link href="/search?type=promoter" className="text-gray-400 hover:text-white transition-colors">
            Promotores
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/messages"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Mensajes
              </Link>
              <Link
                href="/bookings"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Mis reservas
              </Link>
              <Link
                href={`/profiles/${user.profile?.id}`}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-xs">
                  {user.profile?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-400 transition-colors text-sm"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
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
    </nav>
  )
}
