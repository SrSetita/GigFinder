'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Guitar, Mic2, Drum, Megaphone, Building2, Search, ArrowRight, MapPin, Users, Zap } from 'lucide-react'
import MeshBackground from '@/components/ui/MeshBackground'
import AudioWave from '@/components/ui/AudioWave'
import GlassCard from '@/components/ui/GlassCard'

const GENRES = ['Rock', 'Metal', 'Jazz', 'Pop', 'Hip-Hop', 'Electrónica', 'Flamenco', 'Indie', 'Folk', 'R&B']

const FEATURES = [
  {
    icon: Building2,
    title: 'Reserva salas de ensayo',
    desc: 'Encuentra y reserva salas por horas. Calendario en tiempo real, sin sorpresas.',
    href: '/search?type=venue',
    accent: 'rgba(124,58,237,0.15)',
  },
  {
    icon: Mic2,
    title: 'Crea tu perfil de banda',
    desc: 'Sube fotos, vídeos y demos. Conecta tus redes. Hazte visible en toda España.',
    href: '/auth/register?role=BAND',
    accent: 'rgba(236,72,153,0.12)',
  },
  {
    icon: Drum,
    title: 'Encuentra músicos',
    desc: '¿Buscas batería, bajo, cantante? Filtra por género, ciudad e instrumento.',
    href: '/search?type=musician',
    accent: 'rgba(79,70,229,0.15)',
  },
  {
    icon: Megaphone,
    title: 'Para promotores',
    desc: 'Descubre bandas para tus eventos. Contacta directamente desde la app.',
    href: '/search?type=band',
    accent: 'rgba(245,158,11,0.1)',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Crea tu perfil',
    desc: 'Regístrate gratis como músico, banda, sala o promotor. Añade fotos, demos y redes.',
    icon: Users,
  },
  {
    n: '02',
    title: 'Descubre y conecta',
    desc: 'Busca salas por tu ciudad, encuentra músicos o contacta con promotores.',
    icon: Search,
  },
  {
    n: '03',
    title: 'Toca y crece',
    desc: 'Reserva, ensaya y haz crecer tu carrera musical con toda la comunidad.',
    icon: Zap,
  },
]


function useInView(threshold = 0.15) {
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
  const features = useInView()
  const steps    = useInView()
  const genres   = useInView()

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <MeshBackground className="flex flex-col items-center justify-center px-6 py-36 text-center min-h-[88vh]">
        <div className="relative z-10 flex flex-col items-center">


          <h1 className="hero-title text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Encuentra tu banda.<br />
            <span className="text-[var(--accent)] glow-text">Llena tu sala.</span>
          </h1>

          <p className="hero-subtitle text-xl text-gray-400 max-w-2xl mb-8">
            Todo lo que necesita tu música, en un solo sitio.
          </p>

          <AudioWave className="hero-subtitle mb-8 opacity-70" />

          <div className="hero-cta flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary-glow px-8 py-4 rounded-xl font-semibold text-lg">
              Empieza gratis
            </Link>
            <Link
              href="/search?type=venue"
              className="glass hover:border-[var(--accent)]/40 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-[var(--accent)]/5 hover:-translate-y-0.5 flex items-center gap-2"
            >
              Ver salas
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
      </MeshBackground>

      {/* ── Features ── */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Todo lo que necesitas</h2>
          <p className="text-gray-500">Una plataforma, todas las herramientas</p>
        </div>

        <div
          ref={features.ref}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} style={{ transitionDelay: features.inView ? `${i * 80}ms` : '0ms' }}>
              <GlassCard
                hover
                glow
                as="div"
                className="group p-6 relative overflow-hidden cursor-pointer h-full"
                onClick={() => window.location.href = f.href}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at 30% 30%, ${f.accent}, transparent 70%)` }}
                />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center mb-4 group-hover:bg-[var(--accent)]/25 transition-colors">
                    <Icon size={20} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  <span className="mt-4 text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                    Ver más <ArrowRight size={11} />
                  </span>
                </div>
              </GlassCard>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-24 border-y border-white/[0.05] backdrop-blur-sm bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500">Simple. Rápido. Sin complicaciones.</p>
          </div>

          <div
            ref={steps.ref}
            className={`relative transition-all duration-700 ${steps.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {/* Connector line — visible only on md+ */}
            <div className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-px z-0"
              style={{ background: 'linear-gradient(to right, transparent, rgba(124,58,237,0.5) 20%, rgba(124,58,237,0.5) 80%, transparent)' }}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={step.n}
                  style={{ transitionDelay: steps.inView ? `${i * 100}ms` : '0ms' }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-6 relative z-10">
                    <div
                      className="w-20 h-20 rounded-full border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] font-black text-xl hover:bg-[var(--accent)]/10 hover:scale-105 transition-all duration-300 cursor-default"
                      style={{
                        backgroundColor: 'var(--background)',
                        boxShadow: '0 0 0 5px var(--background), 0 0 0 7px rgba(124,58,237,0.25)',
                      }}
                    >
                      {step.n}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Genres ── */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Todos los géneros</h2>
          <div
            ref={genres.ref}
            className="flex flex-wrap justify-center gap-3"
          >
            {GENRES.map((g, i) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                style={genres.inView ? { animationDelay: `${i * 45}ms` } : { opacity: 0 }}
                className="genre-pill glass hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_14px_rgba(124,58,237,0.25)]"
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
