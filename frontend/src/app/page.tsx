import Link from 'next/link'

const GENRES = ['Rock', 'Metal', 'Jazz', 'Pop', 'Hip-Hop', 'Electrónica', 'Flamenco', 'Indie', 'Folk', 'R&B']

const FEATURES = [
  {
    icon: '🎸',
    title: 'Reserva salas de ensayo',
    desc: 'Encuentra y reserva salas por horas. Calendario en tiempo real, sin sorpresas.',
  },
  {
    icon: '🎤',
    title: 'Crea tu perfil de banda',
    desc: 'Sube fotos, vídeos, demos. Conecta tus redes. Hazte visible.',
  },
  {
    icon: '🥁',
    title: 'Encuentra músicos',
    desc: 'Buscas batería, bajo, cantante? Filtra por género, ciudad e instrumento.',
  },
  {
    icon: '📣',
    title: 'Para promotores',
    desc: 'Descubre bandas para tus eventos. Contacta directamente desde la app.',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 py-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/10 to-transparent pointer-events-none" />
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          Tu escenario<br />
          <span className="text-[var(--accent)]">empieza aquí</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mb-10">
          La plataforma para músicos, bandas, salas de ensayo y promotores.
          Reserva, conecta y promociona tu música.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Empieza gratis
          </Link>
          <Link
            href="/search?type=venue"
            className="border border-[var(--border)] hover:border-[var(--accent)] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
          >
            Ver salas
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-14">Todo lo que necesitas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent)]/50 transition-colors"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Genres */}
      <section className="px-6 py-16 bg-[var(--card)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Todos los géneros</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {GENRES.map((g) => (
              <Link
                key={g}
                href={`/search?genre=${encodeURIComponent(g)}`}
                className="bg-[var(--muted)] hover:bg-[var(--accent)]/20 border border-[var(--border)] hover:border-[var(--accent)] px-5 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {g}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-4xl font-black mb-4">¿Tienes una sala de ensayo?</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Registra tu local, gestiona reservas y llega a miles de músicos en tu ciudad.
        </p>
        <Link
          href="/auth/register?role=VENUE"
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-block"
        >
          Registrar mi sala
        </Link>
      </section>
    </div>
  )
}
