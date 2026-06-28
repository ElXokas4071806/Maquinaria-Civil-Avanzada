'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CartDrawer from './CartDrawer'
import { cartEvents } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchCartCount(session.user.id)
      }
    })

    const unsubscribeCart = cartEvents.subscribe(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchCartCount(session.user.id)
      })
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
  }

  return (
    <>
      <nav style={{ background: '#000', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#facc15', fontSize: '22px' }}>⚙</span>
            Maquinaria Civil <span style={{ color: '#facc15' }}>&nbsp;Avanzada</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: 600 }}>
            <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Productos</Link>

            <button onClick={() => setCartOpen(true)}
              style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Carrito
              {cartTotal > 0 && (
                <span style={{ fontSize: '12px', color: '#facc15', fontWeight: 700 }}>
                  ${cartTotal.toLocaleString('es-CO')}
                </span>
              )}
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#facc15', color: '#000', fontSize: '11px', borderRadius: '999px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <>
                <Link href="/pedidos" style={{ color: '#fff', textDecoration: 'none' }}>Mis pedidos</Link>
                {role === 'admin' && (
                  <Link href="/admin" style={{ color: '#facc15', textDecoration: 'none', fontWeight: 800 }}>
                    ⚙ Admin
                  </Link>
                )}
                <button onClick={handleLogout} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ color: '#fff', textDecoration: 'none' }}>Ingresar</Link>
                <Link href="/registro" style={{ background: '#facc15', color: '#000', padding: '8px 18px', borderRadius: '999px', textDecoration: 'none', fontWeight: 800 }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}