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
