'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, cartEvents } from '@/lib/supabase'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
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
        setCartTotal(0)
        setRole('')
      }
    })

    const unsubscribeCart = cartEvents.subscribe(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchCartCount(session.user.id)
      })
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeCart()
    }
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  async function fetchCartCount(userId: string) {
    const { data } = await supabase
      .from('cart_items')
      .select('quantity, products(price)')
      .eq('user_id', userId)
    if (data) {
      const count = data.reduce((sum, item) => sum + item.quantity, 0)
      const total = data.reduce((sum, item: any) => sum + item.products.price * item.quantity, 0)
      setCartCount(count)
      setCartTotal(total)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
  }

  return (
    <>
      <nav style={{ background: '#000', color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Hamburguesa */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px' }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#facc15' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'transparent' : '#fff', transition: 'all 0.3s' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#facc15' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>

          {/* Logo centrado - solo desktop */}
          <Link href="/" style={{ fontSize: '15px', fontWeight: 800, textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <span style={{ color: '#facc15', fontSize: '18px' }}>⚙</span>
            <span>MCA</span>
          </Link>

          {/* Carrito a la derecha */}
          <button onClick={() => setCartOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <div style={{ position: 'relative' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#facc15', color: '#000', fontSize: '10px', borderRadius: '999px', width: '17px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {cartCount}
                </span>
              )}
            </div>
            {cartTotal > 0 && (
              <span style={{ fontSize: '12px', color: '#facc15', fontWeight: 800 }}>
                ${cartTotal.toLocaleString('es-CO')}
              </span>
            )}
          </button>
        </div>

        {/* Menú desplegable */}
        <div style={{
          background: '#111', overflow: 'hidden',
          maxHeight: menuOpen ? '400px' : '0',
          transition: 'max-height 0.35s ease',
        }}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Barra de búsqueda dentro del menú */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: '999px', padding: '8px 14px', gap: '8px', marginBottom: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar productos..."
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', width: '100%' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) { setMenuOpen(false); window.location.href = `/?search=${encodeURIComponent(val)}` }
                  }
                }} />
            </div>

            {cartTotal > 0 && (
              <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '10px 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Total carrito</span>
                <span style={{ color: '#facc15', fontWeight: 800, fontSize: '15px' }}>${cartTotal.toLocaleString('es-CO')}</span>
              </div>
            )}

            {[
              { label: 'Productos', href: '/' },
              { label: 'Mi carrito', href: '#', onClick: () => { setMenuOpen(false); setCartOpen(true) } },
              ...(user ? [
                { label: 'Mis pedidos', href: '/pedidos' },
                ...(role === 'admin' ? [{ label: '⚙ Admin', href: '/admin' }] : []),
              ] : [
                { label: 'Ingresar', href: '/login' },
                { label: 'Registrarse', href: '/registro' },
              ]),
            ].map((item: any) => (
              item.onClick ? (
                <button key={item.label} onClick={item.onClick}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 600, padding: '12px 16px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%' }}>
                  {item.label}
                </button>
              ) : (
                <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                  style={{ color: '#fff', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '12px 16px', borderRadius: '8px', display: 'block' }}>
                  {item.label}
                </Link>
              )
            ))}

            {user && (
              <button onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '15px', fontWeight: 600, padding: '12px 16px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', width: '100%' }}>
                Salir
              </button>
            )}
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}