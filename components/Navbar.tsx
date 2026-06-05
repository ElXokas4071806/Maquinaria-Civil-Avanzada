'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('')
  const [cartCount, setCartCount] = useState(0)

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
  }

  return (
    <nav style={{ background: '#000', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <Link href="/" style={{ fontSize: '18px', fontWeight: 800, textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#facc15', fontSize: '22px' }}>⚙</span>
          Maquinaria Civil <span style={{ color: '#facc15' }}>&nbsp;Avanzada</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', fontWeight: 600 }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Productos</Link>

          <Link href="/carrito" style={{ color: '#fff', textDecoration: 'none', position: 'relative' }}>
            🛒 Carrito
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#facc15', color: '#000', fontSize: '11px', borderRadius: '999px', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {cartCount}
              </span>
            )}
          </Link>

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
  )
}