# GigFinder UI Redesign — Raycast-Inspired Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el estilo glassmorphism/glow genérico por un diseño dark editorial limpio inspirado en Raycast, responsivo en todos los dispositivos.

**Architecture:** Sistema de tokens CSS nuevo → componentes base nuevos (Card, DotGrid, BottomNav) → reescritura de páginas. Las pages no cambian lógica de datos, solo presentación. GlassCard se reescribe internamente para que todas las páginas no-redesign hereden los nuevos estilos sin migración manual.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Inter (Google Fonts), Framer Motion (solo modales/drawers), lucide-react.

**Spec:** `docs/superpowers/specs/2026-05-27-ui-redesign-raycast-design.md`

---

## File Map

| Archivo | Acción |
|---|---|
| `frontend/src/app/globals.css` | Reescritura completa |
| `frontend/src/components/ui/Card.tsx` | Nuevo |
| `frontend/src/components/ui/DotGrid.tsx` | Nuevo |
| `frontend/src/components/layout/BottomNav.tsx` | Nuevo |
| `frontend/src/components/ui/GlassCard.tsx` | Reescribir internamente para usar estilos de Card |
| `frontend/src/components/ui/PageTransition.tsx` | Eliminar wrapper, simplificar a passthrough |
| `frontend/src/app/layout.tsx` | Añadir BottomNav, quitar PageTransition wrapper |
| `frontend/src/app/page.tsx` | Reescritura layout completo |
| `frontend/src/components/layout/Navbar.tsx` | Limpieza desktop + integración BottomNav |
| `frontend/src/app/search/page.tsx` | Refactor cards + filtros + layout |
| `frontend/src/app/profiles/[id]/page.tsx` | Refactor header (banner + avatar + acción) |
| `frontend/src/app/bands/[id]/page.tsx` | Refactor header |
| `frontend/src/app/dashboard/page.tsx` | Layout lista en lugar de grid |

---

## Task 1: Reescribir globals.css

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Reemplazar globals.css completo**

```css
/* frontend/src/app/globals.css */
@import "tailwindcss";

:root {
  /* Superficie */
  --background: #0d0d0d;
  --surface: #141414;
  --surface-raised: #1a1a1a;

  /* Bordes */
  --border: #262626;
  --border-hover: #404040;

  /* Acento */
  --accent: #7c3aed;
  --accent-hover: #8b5cf6;
  --accent-subtle: rgba(124, 58, 237, 0.08);
  --accent-subtle-hover: rgba(124, 58, 237, 0.14);

  /* Texto */
  --text-primary: #ededed;
  --text-secondary: #8c8c8c;
  --text-muted: #525252;

  /* Easing único para toda la UI */
  --ease-ui: cubic-bezier(0.25, 0, 0, 1);
}

body {
  background: var(--background);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  font-feature-settings: "cv02", "cv03", "cv04";
  -webkit-font-smoothing: antialiased;
}

* {
  border-color: var(--border);
}

/* ─── Tipografía responsive ─── */
.text-hero {
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.text-display {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* ─── Botón primario ─── */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  border-radius: 10px;
  transition: background 150ms var(--ease-ui), transform 120ms var(--ease-ui);
}
.btn-primary:hover {
  background: var(--accent-hover);
}
.btn-primary:active {
  transform: scale(0.97);
}

/* ─── Botón ghost ─── */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-primary);
  font-weight: 600;
  border-radius: 10px;
  border: 1px solid var(--border);
  transition: border-color 150ms var(--ease-ui), background 150ms var(--ease-ui), transform 120ms var(--ease-ui);
}
.btn-ghost:hover {
  border-color: var(--border-hover);
  background: var(--surface);
}
.btn-ghost:active {
  transform: scale(0.97);
}

/* ─── Genre pill ─── */
.genre-pill {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: border-color 150ms var(--ease-ui), color 150ms var(--ease-ui), background 150ms var(--ease-ui);
}
@media (hover: hover) and (pointer: fine) {
  .genre-pill:hover {
    border-color: var(--accent);
    color: var(--text-primary);
    background: var(--accent-subtle);
  }
}
.genre-pill:active {
  transform: scale(0.97);
}

/* ─── DotGrid background ─── */
.dot-grid {
  position: relative;
  background-color: var(--background);
  background-image: radial-gradient(circle, #2a2a2a 1px, transparent 1px);
  background-size: 28px 28px;
}
.dot-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124, 58, 237, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

/* ─── Audio wave bars (solo en perfiles músico/banda) ─── */
.audio-bar {
  animation: audio-wave 1.8s ease-in-out infinite;
  will-change: transform;
  transform-origin: center 50%;
}
.audio-bar:nth-child(1) { animation-delay: 0.0s; }
.audio-bar:nth-child(2) { animation-delay: 0.2s; }
.audio-bar:nth-child(3) { animation-delay: 0.4s; }
.audio-bar:nth-child(4) { animation-delay: 0.6s; }
.audio-bar:nth-child(5) { animation-delay: 0.8s; }

@keyframes audio-wave {
  0%, 100% { transform: scaleY(0.4); }
  50%       { transform: scaleY(1); }
}

/* ─── Fade-up para entrada de secciones ─── */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 0.3s var(--ease-ui) both;
}

/* ─── Stagger helpers (hasta 8 items) ─── */
.stagger-1 { animation-delay: 30ms; }
.stagger-2 { animation-delay: 60ms; }
.stagger-3 { animation-delay: 90ms; }
.stagger-4 { animation-delay: 120ms; }
.stagger-5 { animation-delay: 150ms; }
.stagger-6 { animation-delay: 180ms; }
.stagger-7 { animation-delay: 210ms; }
.stagger-8 { animation-delay: 240ms; }

/* ─── Hover gates: solo en dispositivos con hover real ─── */
@media (hover: hover) and (pointer: fine) {
  .hover-lift:hover {
    border-color: var(--border-hover) !important;
    background: var(--surface-raised) !important;
  }
}

/* ─── Note float (eliminado del hero, kept por compatibilidad) ─── */
@keyframes note-float {
  0%   { transform: translateY(0)   opacity: 1; }
  100% { transform: translateY(-80px); opacity: 0; }
}
```

- [ ] **Step 2: Verificar que el servidor de dev no rompe**

```bash
# En /frontend
npm run dev
```
Esperado: compila sin errores. Las páginas existentes pueden verse raras visualmente — es esperado, se arregla en tareas siguientes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/globals.css
git commit -m "style: rewrite CSS tokens — Raycast dark editorial system"
```

---

## Task 2: Crear componente Card

**Files:**
- Create: `frontend/src/components/ui/Card.tsx`

- [ ] **Step 1: Crear Card.tsx**

```tsx
// frontend/src/components/ui/Card.tsx
import { ElementType, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  hover?: boolean
}

export default function Card({
  children,
  className = '',
  as: Tag = 'div',
  hover = false,
  ...props
}: CardProps) {
  return (
    <Tag
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-xl
        ${hover ? 'transition-colors duration-150 hover-lift cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: Verificar que compila**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Esperado: sin errores referentes a Card.tsx.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/Card.tsx
git commit -m "feat: add Card component — flat surface, no glassmorphism"
```

---

## Task 3: Actualizar GlassCard para usar estilos de Card

Todas las páginas que no se redesignan en este plan (auth, gigs, bookings, settings, venues) usan GlassCard. En lugar de migrar cada una, reescribimos GlassCard para que use los mismos estilos de Card internamente.

**Files:**
- Modify: `frontend/src/components/ui/GlassCard.tsx`

- [ ] **Step 1: Reescribir GlassCard.tsx**

```tsx
// frontend/src/components/ui/GlassCard.tsx
// Rewritten to use new Card styles. Props kept for backward compat.
import { ElementType, HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  hover?: boolean
  glow?: boolean  // kept for compat, no longer applies glow
  as?: ElementType
}

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow: _glow,
  as: Tag = 'div',
  ...props
}: GlassCardProps) {
  return (
    <Tag
      className={`
        bg-[var(--surface)] border border-[var(--border)] rounded-xl
        ${hover ? 'transition-colors duration-150 hover-lift cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: Verificar que todas las páginas que usan GlassCard compilan**

```bash
npx tsc --noEmit 2>&1 | head -30
```
Esperado: sin errores de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/GlassCard.tsx
git commit -m "style: GlassCard → flat surface styles, backward-compat props"
```

---

## Task 4: Crear componente DotGrid

**Files:**
- Create: `frontend/src/components/ui/DotGrid.tsx`

- [ ] **Step 1: Crear DotGrid.tsx**

```tsx
// frontend/src/components/ui/DotGrid.tsx
import { HTMLAttributes } from 'react'

interface DotGridProps extends HTMLAttributes<HTMLDivElement> {}

export default function DotGrid({ children, className = '', ...props }: DotGridProps) {
  return (
    <div className={`dot-grid ${className}`} {...props}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ui/DotGrid.tsx
git commit -m "feat: add DotGrid component — static CSS dot pattern background"
```

---

## Task 5: Crear BottomNav (mobile)

**Files:**
- Create: `frontend/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Crear BottomNav.tsx**

```tsx
// frontend/src/components/layout/BottomNav.tsx
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
    >
      <div className="grid grid-cols-4">
        {allItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/BottomNav.tsx
git commit -m "feat: add BottomNav — mobile navigation bar with 4 items"
```

---

## Task 6: Actualizar layout.tsx — añadir BottomNav, eliminar PageTransition

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/ui/PageTransition.tsx`

- [ ] **Step 1: Simplificar PageTransition a passthrough**

```tsx
// frontend/src/components/ui/PageTransition.tsx
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Actualizar layout.tsx**

```tsx
// frontend/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import VerificationBanner from '@/components/layout/VerificationBanner'
import { AuthProvider } from '@/lib/AuthContext'
import { ToastProvider } from '@/lib/ToastContext'
import OnboardingModal from '@/components/ui/OnboardingModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GigFinder — Encuentra tu sala, tu banda, tu escenario',
  description: 'Plataforma para músicos, bandas, salas de ensayo y promotores. Reserva salas, encuentra músicos, promociona tu banda.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <VerificationBanner />
            <OnboardingModal />
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

Nota: `pb-16 md:pb-0` reserva espacio para el BottomNav en mobile.

- [ ] **Step 3: Verificar en browser a 375px de ancho**

Abrir `http://localhost:3000`. Redimensionar a 375px. Debe aparecer barra inferior con 4 items. En desktop (>768px) no debe aparecer.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layout.tsx frontend/src/components/ui/PageTransition.tsx
git commit -m "feat: add BottomNav to layout, remove PageTransition wrapper"
```

---

## Task 7: Reescribir Navbar — limpiar desktop

**Files:**
- Modify: `frontend/src/components/layout/Navbar.tsx`

- [ ] **Step 1: Reescribir Navbar.tsx**

```tsx
// frontend/src/components/layout/Navbar.tsx
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
```

- [ ] **Step 2: Verificar en browser desktop y mobile**

- Desktop (>768px): logo izquierda, links centro, acciones derecha. Sin iconos en links de texto.
- Mobile (<768px): logo izquierda, avatar/botón login derecha. Sin hamburguesa (la nav está en BottomNav).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/Navbar.tsx
git commit -m "style: Navbar — clean desktop links, remove redundant icons"
```

---

## Task 8: Reescribir Home page

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Reescribir page.tsx completo**

```tsx
// frontend/src/app/page.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Guitar, Mic2, Drum, Megaphone, Building2, Search, ArrowRight, MapPin, Users, Zap } from 'lucide-react'
import DotGrid from '@/components/ui/DotGrid'
import Card from '@/components/ui/Card'

const GENRES = ['Rock', 'Metal', 'Jazz', 'Pop', 'Hip-Hop', 'Electrónica', 'Flamenco', 'Indie', 'Folk', 'R&B']

const FEATURES = [
  {
    icon: Building2,
    title: 'Reserva locales y salas',
    desc: 'Encuentra locales para tocar, actuar o ensayar. Reserva por horas, calendario en tiempo real.',
    href: '/search?type=venue',
  },
  {
    icon: Mic2,
    title: 'Crea tu perfil de banda',
    desc: 'Sube fotos, vídeos y demos. Conecta tus redes. Hazte visible en toda España.',
    href: '/auth/register?role=BAND',
  },
  {
    icon: Drum,
    title: 'Encuentra músicos',
    desc: '¿Buscas batería, bajo, cantante? Filtra por género, ciudad e instrumento.',
    href: '/search?type=musician',
  },
  {
    icon: Megaphone,
    title: 'Para promotores',
    desc: 'Descubre bandas para tus eventos. Contacta directamente desde la app.',
    href: '/search?type=band',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Crea tu perfil',
    desc: 'Regístrate gratis como músico, banda, sala o promotor. Añade fotos, demos y redes.',
  },
  {
    n: '02',
    title: 'Descubre y conecta',
    desc: 'Busca salas por tu ciudad, encuentra músicos o contacta con promotores.',
  },
  {
    n: '03',
    title: 'Toca y crece',
    desc: 'Reserva, ensaya y haz crecer tu carrera musical con toda la comunidad.',
  },
]

function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

export default function HomePage() {
  const genres = useInView()
  const steps = useInView()

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <DotGrid className="flex flex-col items-center justify-center px-6 py-32 text-center min-h-[86vh] relative">
        <div className="relative z-10 flex flex-col items-center max-w-[1120px] mx-auto w-full">

          <div className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-1.5 text-[12px] text-[var(--text-muted)] mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Plataforma para músicos, bandas y salas en España
          </div>

          <h1 className="text-hero mb-6 animate-fade-up stagger-1">
            Encuentra tu banda.<br />
            <span className="text-[var(--accent)]">Llena tu sala.</span>
          </h1>

          <p className="text-[1.125rem] text-[var(--text-secondary)] max-w-xl mb-10 leading-relaxed animate-fade-up stagger-2">
            Todo lo que necesita tu música, en un solo sitio.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up stagger-3">
            <Link href="/auth/register" className="btn-primary px-8 py-3 text-[15px]">
              Empieza gratis
            </Link>
            <Link href="/search?type=venue" className="btn-ghost px-8 py-3 text-[15px] flex items-center gap-2">
              Ver salas
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </DotGrid>

      {/* ── Features ── */}
      <section className="px-6 py-24 max-w-[1120px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <Link key={f.title} href={f.href}>
              <Card
                hover
                className="p-6 flex flex-col gap-3 h-full"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                  <Icon size={17} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] mb-1">{f.title}</h3>
                  <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">{f.desc}</p>
                </div>
                <span className="mt-auto text-[12px] text-[var(--accent)] flex items-center gap-1">
                  Ver más <ArrowRight size={11} />
                </span>
              </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        ref={steps.ref}
        className="px-6 py-24 border-y border-[var(--border)]"
      >
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-display mb-3">¿Cómo funciona?</h2>
            <p className="text-[var(--text-muted)] text-[15px]">Simple. Rápido. Sin complicaciones.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={`flex flex-col items-center text-center ${steps.inView ? `animate-fade-up stagger-${i + 1}` : 'opacity-0'}`}
              >
                <span
                  className="text-[4rem] font-black text-[var(--border)] leading-none mb-4 select-none tabular-nums"
                  aria-hidden="true"
                >
                  {step.n}
                </span>
                <h3 className="font-semibold text-[16px] mb-2">{step.title}</h3>
                <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Géneros ── */}
      <section className="px-6 py-24">
        <div className="max-w-[1120px] mx-auto">
          <h2 className="text-display mb-10 text-center">Todos los géneros</h2>
          <div
            ref={genres.ref}
            className="flex flex-wrap justify-center gap-2"
          >
            {GENRES.map((g, i) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                style={{ animationDelay: genres.inView ? `${i * 30}ms` : '0ms' }}
                className={`genre-pill px-5 py-2 rounded-full text-[13px] font-medium ${genres.inView ? 'animate-fade-up' : 'opacity-0'}`}
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
```

- [ ] **Step 2: Verificar en browser**

- Desktop: hero centrado, DotGrid visible, h1 grande, botones limpios.
- Mobile (375px): texto se recorta bien con `clamp()`, grid features en 1 col.
- Sin notas flotantes, sin mesh gradients animados.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: rewrite home — Raycast-inspired hero, clean features grid"
```

---

## Task 9: Refactor Search page

**Files:**
- Modify: `frontend/src/app/search/page.tsx`

La página mantiene toda la lógica de datos. Solo cambian:
1. Filtros de sidebar → pills inline debajo de la barra de búsqueda
2. Cards de resultados → usar Card component, sin `GlassCard hover glow`
3. Botones de paginación → estilo `btn-ghost`

- [ ] **Step 1: Leer la página completa para entender la estructura actual**

```bash
cat frontend/src/app/search/page.tsx
```

- [ ] **Step 2: Reemplazar import de GlassCard por Card**

En `frontend/src/app/search/page.tsx`, línea 8:
```tsx
// Antes:
import GlassCard from '@/components/ui/GlassCard'
// Después:
import Card from '@/components/ui/Card'
```

- [ ] **Step 3: Reemplazar bloque de filtros sidebar**

Buscar el bloque que contiene `<GlassCard className="p-6 flex flex-col gap-4 sticky top-20">` y reemplazar por filtros inline en forma de pills debajo de la search bar. El nuevo bloque de filtros:

```tsx
{/* Filtros inline — reemplaza el sidebar */}
<div className="flex flex-wrap gap-2 mt-3">
  {(['venue', 'band', 'musician', 'promoter'] as const).map(type => (
    <button
      key={type}
      onClick={() => setForm(f => ({ ...f, type: f.type === type ? '' : type }))}
      className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors duration-150
        ${form.type === type
          ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--accent)]'
          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
        }`}
    >
      {TYPE_LABELS[type]}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Reemplazar todas las ocurrencias de `<GlassCard hover glow` por `<Card hover`**

En el archivo, buscar y reemplazar:
- `<GlassCard hover glow className=` → `<Card hover className=`
- `</GlassCard>` → `</Card>`
- `<GlassCard className=` → `<Card className=`

- [ ] **Step 5: Reemplazar clases de botones**

Buscar clases `btn-primary-glow` y reemplazar por `btn-primary`.
Buscar `glass hover:border-[var(--accent)]/40` en botones de paginación y reemplazar por `btn-ghost`.

- [ ] **Step 6: Verificar en browser**

- `/search?type=venue`: resultados aparecen como Cards planas con borde fino.
- Filtros de tipo visibles como pills debajo de la barra.
- En mobile 375px: grid 1 col, filtros wrappean correctamente.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/search/page.tsx
git commit -m "style: search page — inline filter pills, Card components, clean buttons"
```

---

## Task 10: Refactor Profile page — header

**Files:**
- Modify: `frontend/src/app/profiles/[id]/page.tsx`

Solo se rediseña el bloque header del perfil. La lógica de datos, reviews, media gallery no cambia.

- [ ] **Step 1: Localizar el bloque del header**

```bash
grep -n "bannerUrl\|ROLE_BANNER\|avatarUrl\|displayName" frontend/src/app/profiles/\[id\]/page.tsx | head -15
```

- [ ] **Step 2: Reemplazar el bloque header completo**

Localizar el div que renderiza el banner/avatar del perfil y reemplazarlo por:

```tsx
{/* ── Header ── */}
<div className="mb-8">
  {/* Banner */}
  <div
    className="w-full h-48 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
    style={profile.bannerUrl ? {} : { background: 'var(--surface-raised)' }}
  >
    {profile.bannerUrl && (
      <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
    )}
    {isOwner && (
      <DropZone onFile={uploadBanner} accept="image/*" className="absolute inset-0 opacity-0 hover:opacity-100">
        <div className="w-full h-full flex items-center justify-center bg-black/40 text-white text-sm">
          Cambiar banner
        </div>
      </DropZone>
    )}
  </div>

  {/* Avatar + info + acción */}
  <div className="flex items-end justify-between gap-4 -mt-10 px-1">
    <div className="relative">
      <div className="w-20 h-20 rounded-xl bg-[var(--surface)] border-2 border-[var(--background)] overflow-hidden">
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--text-muted)]">
              {profile.displayName?.[0]?.toUpperCase()}
            </div>
        }
      </div>
    </div>

    {/* Botón acción */}
    <div className="pb-1">
      {isOwner ? (
        <Link href="/settings/profile" className="btn-ghost px-4 py-2 text-[13px]">
          Editar perfil
        </Link>
      ) : (
        <button onClick={handleContact} disabled={messaging} className="btn-primary px-4 py-2 text-[13px]">
          {messaging ? 'Enviando...' : 'Contactar'}
        </button>
      )}
    </div>
  </div>

  {/* Nombre + rol + ciudad */}
  <div className="mt-3 px-1">
    <div className="flex items-center gap-2 mb-1">
      <h1 className="text-[1.5rem] font-bold">{profile.displayName}</h1>
      {profile.verified && <CheckCircle2 size={16} className="text-[var(--accent)]" />}
    </div>
    <div className="flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
      <span>{ROLE_LABELS[profile.role]}</span>
      {profile.city && (
        <>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {profile.city}
          </span>
        </>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Reemplazar import GlassCard por Card en este archivo**

```tsx
// Antes:
import GlassCard from '@/components/ui/GlassCard'
// Después:
import Card from '@/components/ui/Card'
```

Reemplazar `<GlassCard` → `<Card` y `</GlassCard>` → `</Card>` en el resto del archivo.

- [ ] **Step 4: Eliminar ROLE_BANNER (ya no se usa)**

Borrar el objeto `ROLE_BANNER` del archivo si ya no se referencia.

- [ ] **Step 5: Verificar en browser**

Navegar a un perfil existente. Banner full-width con `h-48`, avatar superpuesto, nombre + rol debajo, botón acción arriba-derecha.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/profiles/\[id\]/page.tsx
git commit -m "style: profile page — clean header, flat Card sections"
```

---

## Task 11: Refactor Band page — header

**Files:**
- Modify: `frontend/src/app/bands/[id]/page.tsx`

- [ ] **Step 1: Reemplazar header de la banda**

Localizar el bloque `{/* Header */}` y reemplazarlo:

```tsx
{/* ── Header ── */}
<div className="flex items-start gap-4 mb-8 pb-8 border-b border-[var(--border)]">
  <div className="w-16 h-16 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
    {band.avatarUrl
      ? <img src={band.avatarUrl} className="w-full h-full object-cover" />
      : <Music2 size={24} className="text-[var(--text-muted)]" />
    }
  </div>
  <div className="flex-1 min-w-0">
    <h1 className="text-[1.5rem] font-bold mb-1">{band.name}</h1>
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
    <Link href={`/bands/${band.id}/manage`} className="btn-ghost px-4 py-2 text-[13px] flex-shrink-0">
      <Settings size={14} className="mr-1.5" />
      Gestionar
    </Link>
  )}
</div>
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/bands/[id]`. Header limpio con avatar cuadrado, nombre, ciudad, géneros, botón gestionar si es admin.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/bands/\[id\]/page.tsx
git commit -m "style: band page — clean header layout"
```

---

## Task 12: Refactor Dashboard — lista en lugar de grid

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`

- [ ] **Step 1: Leer la sección de render de bandas**

```bash
grep -n "Band\|band\|grid\|GlassCard" frontend/src/app/dashboard/page.tsx | head -20
```

- [ ] **Step 2: Reemplazar grid de bandas por lista de filas**

Localizar el bloque que mapea `bands` y reemplazarlo:

```tsx
{/* ── Mis bandas ── */}
<div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
  {bands.map(band => (
    <Link
      key={band.id}
      href={`/bands/${band.id}`}
      className="flex items-center gap-4 px-4 py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-raised)] transition-colors duration-150"
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {band.avatarUrl
          ? <img src={band.avatarUrl} className="w-full h-full object-cover" />
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
```

- [ ] **Step 3: Reemplazar invitaciones pendientes por banner top**

Localizar el bloque de invitaciones y colocarlo como un banner sobre la lista de bandas:

```tsx
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
```

- [ ] **Step 4: Añadir import ArrowRight si no existe**

```tsx
import { Music2, Plus, MapPin, Users, Check, X, Crown, ArrowRight } from 'lucide-react'
```

- [ ] **Step 5: Verificar en browser**

`/dashboard`: lista de bandas como filas, no grid. Invitaciones como banner destacado arriba.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "style: dashboard — list layout for bands, invitation banner"
```

---

## Task 13: Verificación final responsive

- [ ] **Step 1: Verificar en 375px (mobile)**

- Home: BottomNav visible, hero h1 legible, features 1 col, géneros wrappean.
- Search: filtros como pills, resultados 1 col.
- Dashboard: lista de bandas full-width.
- Navbar: solo logo + avatar, sin links de texto.

- [ ] **Step 2: Verificar en 768px (tablet)**

- Home: features 2 col.
- Search: resultados 2 col.
- Navbar: BottomNav desaparece, los links desktop aparecen.

- [ ] **Step 3: Verificar en 1280px (desktop)**

- Home: features 4 col, hero centrado.
- Search: resultados 3 col.
- Navbar: todos los links visibles.

- [ ] **Step 4: Verificar AI slop test**

Ningún elemento debe tener: glassmorphism, gradient text, side-stripe borders, hero-metric templates, card grids idénticas sin distinción. Comparar con spec sección "AI slop test".

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "style: UI redesign complete — Raycast-inspired dark editorial"
```

---

## Criterios de aceptación finales

- [ ] Animaciones: todas ≤ 300ms, usando `var(--ease-ui)`, sin `ease-in`
- [ ] Responsive funcional en 375px, 768px, 1280px sin scroll horizontal
- [ ] BottomNav presente en mobile, oculto en desktop
- [ ] Sin glassmorphism en páginas internas
- [ ] Sin `btn-primary-glow`, sin `glow-text`, sin `mesh-drift`
- [ ] Cards usan `var(--surface)` + `var(--border)` solamente
- [ ] Botones tienen `scale(0.97)` en `:active`
- [ ] Hover states gated con `@media (hover: hover) and (pointer: fine)`
