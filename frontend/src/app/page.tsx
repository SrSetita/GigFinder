// frontend/src/app/page.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Mic2, Drum, Megaphone, ArrowRight } from 'lucide-react'
import DotGrid from '@/components/ui/DotGrid'
import Card from '@/components/ui/Card'
import AudioWave from '@/components/ui/AudioWave'

const GENRES = [
  'Rock', 'Metal', 'Jazz', 'Pop', 'Hip-Hop', 'Electrónica', 'Flamenco', 'Indie',
  'Folk', 'R&B', 'Punk', 'Reggae', 'Soul', 'Funk', 'Blues', 'Reggaeton',
  'Trap', 'Salsa', 'Ska', 'Techno', 'House', 'Latin',
]

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
  { n: '01', title: 'Crea tu perfil',    desc: 'Regístrate gratis como músico, banda, sala o promotor. Añade fotos, demos y redes.' },
  { n: '02', title: 'Descubre y conecta', desc: 'Busca salas por tu ciudad, encuentra músicos o contacta con promotores.' },
  { n: '03', title: 'Toca y crece',       desc: 'Reserva, ensaya y haz crecer tu carrera musical con toda la comunidad.' },
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

function useTypingSequence(parts: string[], speed = 70, holdAfter = 250) {
  const [step, setStep] = useState(0)
  const [chars, setChars] = useState(0)
  useEffect(() => {
    if (step >= parts.length) return
    const current = parts[step]
    if (chars < current.length) {
      const t = setTimeout(() => setChars(chars + 1), speed)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setStep(step + 1)
      setChars(0)
    }, holdAfter)
    return () => clearTimeout(t)
  }, [step, chars, parts, speed, holdAfter])
  return { step, chars }
}

export default function HomePage() {
  const steps = useInView()

  const heroRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const typing = useTypingSequence(['Encuentra tu banda.', 'Llena tu sala.'])
  const part1Done = typing.step > 0
  const part2Done = typing.step > 1

  useEffect(() => {
    const hero = heroRef.current
    const glow = glowRef.current
    if (!hero || !glow) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        glow.style.setProperty('--mx', `${x}px`)
        glow.style.setProperty('--my', `${y}px`)
      })
    }
    const onEnter = () => glow.classList.add('active')
    const onLeave = () => glow.classList.remove('active')
    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseenter', onEnter)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseenter', onEnter)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <DotGrid ref={heroRef} className="flex flex-col items-center justify-center px-6 py-32 text-center min-h-[86vh] relative overflow-hidden">
        <div className="hero-ambient" aria-hidden="true" />
        <div ref={glowRef} className="mouse-glow" aria-hidden="true" />

        {([
          { char: '♪', left: '8%',  bottom: '-12%', delay: '0s',   dur: '8.0s',  size: 22, color: 'var(--accent)' },
          { char: '♫', left: '22%', bottom: '-10%', delay: '1.8s', dur: '9.2s',  size: 18, color: 'var(--accent-2)' },
          { char: '♩', left: '38%', bottom: '-14%', delay: '0.6s', dur: '7.5s',  size: 26, color: 'var(--accent)' },
          { char: '♬', left: '55%', bottom: '-11%', delay: '2.5s', dur: '10.0s', size: 20, color: 'var(--accent-2)' },
          { char: '♪', left: '70%', bottom: '-13%', delay: '1.1s', dur: '8.8s',  size: 17, color: 'var(--accent)' },
          { char: '♫', left: '85%', bottom: '-10%', delay: '3.2s', dur: '9.5s',  size: 21, color: 'var(--accent-2)' },
          { char: '♩', left: '15%', bottom: '-15%', delay: '2.0s', dur: '10.5s', size: 16, color: 'var(--accent)' },
          { char: '♬', left: '62%', bottom: '-12%', delay: '0.4s', dur: '8.5s',  size: 19, color: 'var(--accent-2)' },
        ] as const).map((n, i) => (
          <span
            key={i}
            className="note-float"
            style={{ left: n.left, bottom: n.bottom, animationDelay: n.delay, animationDuration: n.dur, fontSize: n.size, color: n.color }}
            aria-hidden="true"
          >
            {n.char}
          </span>
        ))}

        <div className="relative z-10 flex flex-col items-center max-w-[1120px] mx-auto w-full">

          <h1 className="text-hero mb-6 min-h-[2.1em]">
            <span className="block">
              {typing.step === 0 ? 'Encuentra tu banda.'.slice(0, typing.chars) : 'Encuentra tu banda.'}
              {!part1Done && <span className="caret" aria-hidden="true">&nbsp;</span>}
            </span>
            <span className="block gradient-text">
              {typing.step === 1 ? 'Llena tu sala.'.slice(0, typing.chars) : (part2Done ? 'Llena tu sala.' : ' ')}
              {part1Done && !part2Done && <span className="caret" aria-hidden="true">&nbsp;</span>}
            </span>
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

          <div className="mt-12 flex justify-center animate-fade-up stagger-4">
            <AudioWave className="h-10 opacity-70" />
          </div>
        </div>
      </DotGrid>

      {/* ── Features ── */}
      <section className="px-6 py-24 max-w-[1120px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <Link key={f.title} href={f.href} className="group">
                <Card hover className="p-6 flex flex-col gap-3 h-full">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-[var(--accent-subtle-hover)]">
                    <Icon size={17} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px] mb-1 transition-colors group-hover:text-[var(--accent)]">{f.title}</h3>
                    <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">{f.desc}</p>
                  </div>
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
            <h2 className="text-display mb-3">¿Cómo <span className="gradient-text">funciona</span>?</h2>
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

      {/* ── Marquee de géneros ── */}
      <section className="py-16">
        <div className="marquee">
          <div className="marquee-track">
            {[...GENRES, ...GENRES].map((item, i) => {
              const variant = i % 3
              const textClass =
                variant === 0
                  ? 'gradient-text'
                  : variant === 1
                  ? 'text-[var(--accent-2)]'
                  : 'text-[var(--text-primary)]'
              return (
                <Link
                  key={i}
                  href={`/search?genre=${encodeURIComponent(item)}`}
                  className="marquee-item text-[1.75rem] md:text-[2.5rem] font-black tracking-tight whitespace-nowrap flex items-center gap-12"
                  style={{ animationDelay: `${(i % GENRES.length) * 0.15}s` }}
                >
                  <span className={textClass}>{item}</span>
                  <span className="text-[var(--accent)] opacity-50 text-[0.55em]" aria-hidden="true">●</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}
