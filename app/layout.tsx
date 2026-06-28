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
        <footer style={{ background: '#111', color: '#fff', marginTop: '48px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ color: '#facc15', fontSize: '24px' }}>⚙</span>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>Maquinaria Civil <span style={{ color: '#facc15' }}>Avanzada</span></span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                Herramientas y equipos de alta calidad para tu obra. Asesoría experta y envíos a todo Colombia.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="https://facebook.com" target="_blank" style={{ background: '#222', color: '#fff', width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>f</a>
                <a href="https://instagram.com" target="_blank" style={{ background: '#222', color: '#fff', width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>ig</a>
                <a href="https://wa.me/573001234567" target="_blank" style={{ background: '#222', color: '#fff', width: '36px', height: '36px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>wa</a>
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', color: '#facc15' }}>Visítanos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#9ca3af', fontSize: '14px' }}>
                <p style={{ margin: 0 }}>📍 Calle XX # XX - XX, Bogotá D.C.</p>
                <p style={{ margin: 0 }}>📞 Tel: 601 XXX XXXX</p>
                <p style={{ margin: 0 }}>📱 Cel: 300 XXX XXXX</p>
                <p style={{ margin: 0 }}>✉️ correo@maquinariacivilavanzada.com</p>
              </div>
              <div style={{ marginTop: '16px', color: '#9ca3af', fontSize: '14px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#fff' }}>Horario</p>
                <p style={{ margin: 0 }}>Lunes – Viernes: 8:00am – 5:30pm</p>
                <p style={{ margin: 0 }}>Sábado: 8:00am – 12:30pm</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', color: '#facc15' }}>Navegación</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Inicio', href: '/' },
                  { label: 'Mi carrito', href: '/carrito' },
                  { label: 'Mis pedidos', href: '/pedidos' },
                  { label: 'Mi cuenta', href: '/cuenta' },
                ].map(link => (
                  <a key={link.label} href={link.href} style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '14px' }}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', color: '#facc15' }}>¿Necesitas ayuda?</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                Nuestros asesores están disponibles para ayudarte a elegir el equipo perfecto para tu proyecto.
              </p>
              <a href="https://wa.me/573001234567" target="_blank"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#25d366', color: '#fff', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
                <span style={{ fontSize: '20px' }}>💬</span>
                ¿Cómo podemos ayudarte?
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #222', padding: '20px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>© 2026 Maquinaria Civil Avanzada. Todos los derechos reservados.</p>
              <div style={{ display: 'flex', gap: '24px' }}>
                <a href="#" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Política de privacidad</a>
                <a href="#" style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none' }}>Devoluciones</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}