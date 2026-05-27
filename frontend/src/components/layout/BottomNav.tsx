'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { Search, Mail, CalendarDays, User } from 'lucide-react'

const ITEMS = [
  { href: '/search',   label: 'Explorar',    icon: Search },
  { href: '/messages', label: 'Mensajes',    icon: Mail },
  { href: '/bookings', label: 'Solicitudes', icon: CalendarDays },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const profileHref = user.profile?.id ? `/profiles/${user.profile.id}` : '/settings/profile'

  const allItems = [
    ...ITEMS,
    { href: profileHref, label: 'Perfil', icon: User },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[200] bg-[var(--surface)] border-t border-[var(--border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación móvil"
    >
      <div className="grid grid-cols-4">
        {allItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium
                transition-colors duration-150
                ${active
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] active:text-[var(--text-secondary)]'
                }
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
