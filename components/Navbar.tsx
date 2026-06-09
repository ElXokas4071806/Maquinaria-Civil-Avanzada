'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchCartCount(session.user.id)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchCartCount(session.user.id)
      } else {
        setCartCount(0)
        setRole('')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  async function fetchCartCount(userId: string) {
    const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', userId)
    if (data) {
      const total = data.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(total)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
  }

  return (
    <nav style={{ background: '#000', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#facc15', fontSize: '20px' }}>⚙</span>
          Maquinaria Civil Avanzada<span style={{ color: '#facc15' }}></span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '14px', fontWeight: 600 }} className="desktop-nav">
          <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Productos</Link>
          <Link href="/carrito" style={{ color: '#fff', textDecoration: 'none', position: 'relative' }}>
            🛒 Carrito {cartCount > 0 && <span style={{ background: '#facc15', color: '#000', fontSize: '11px', borderRadius: '999px', padding: '1px 6px', marginLeft: '4px', fontWeight: 800 }}>{cartCount}</span>}
          </Link>
          {user ? (
            <>
              <Link href="/pedidos" style={{ color: '#fff', textDecoration: 'none' }}>Pedidos</Link>
              {role === 'admin' && <Link href="/admin" style={{ color: '#facc15', textDecoration: 'none', fontWeight: 800 }}>Admin</Link>}
              <button onClick={handleLogout} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#fff', textDecoration: 'none' }}>Ingresar</Link>
              <Link href="/registro" style={{ background: '#facc15', color: '#000', padding: '7px 16px', borderRadius: '999px', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>Registrarse</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '24px' }} className="hamburger">
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: '#111', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '15px', fontWeight: 600 }} className="mobile-menu">
          <Link href="/" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>Productos</Link>
          <Link href="/carrito" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>🛒 Carrito {cartCount > 0 && `(${cartCount})`}</Link>
          {user ? (
            <>
              <Link href="/pedidos" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>Mis pedidos</Link>
              {role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ color: '#facc15', textDecoration: 'none' }}>⚙ Admin</Link>}
              <button onClick={handleLogout} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 600, textAlign: 'left', padding: 0 }}>Salir</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: '#fff', textDecoration: 'none' }}>Ingresar</Link>
              <Link href="/registro" onClick={() => setMenuOpen(false)} style={{ color: '#facc15', textDecoration: 'none' }}>Registrarse</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  )
}