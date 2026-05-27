// frontend/src/app/page.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Mic2, Drum, Megaphone, ArrowRight } from 'lucide-react'
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
                <Card hover className="p-6 flex flex-col gap-3 h-full">
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
