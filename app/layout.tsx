import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Maquinaria Civil Avanzada',
description: 'Herramientas y equipos para construcción en Colombia',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-black text-white text-center py-6 mt-12">
          <p className="text-sm">© 2026 Maquinaria civil avanzada. Todos los derechos reservados.</p>
        </footer>
      </body>
    </html>
  )
}