'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

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

    // Cerrar sugerencias al hacer clic afuera
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      unsubscribeCart()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .eq('active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(5)
      if (data) {
        setSuggestions(data)
        setShowSuggestions(true)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

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

  function handleSearch(q: string) {
    if (!q.trim()) return
    setShowSuggestions(false)
    setMenuOpen(false)
    window.location.href = `/?search=${encodeURIComponent(q.trim())}`
  }

  const SearchBar = ({ dark = false }: { dark?: boolean }) => (
    <div ref={dark ? undefined : searchRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: dark ? '#222' : '#1a1a1a', borderRadius: '999px', padding: '8px 14px', gap: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', width: '100%' }}
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false) }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: '8px', zIndex: 100, overflow: 'hidden' }}>
          {suggestions.map(product => (
            <Link key={product.id} href={`/productos/${product.slug}`}
              onClick={() => { setShowSuggestions(false); setSearchQuery('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚙️</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111' }}>{product.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#ca8a04', fontWeight: 700 }}>${product.price.toLocaleString('es-CO')}</p>
              </div>
            </Link>
          ))}
          <button onClick={() => handleSearch(searchQuery)}
            style={{ width: '100%', padding: '10px 14px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600, textAlign: 'left' }}>
            Ver todos los resultados de "{searchQuery}" →
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      <nav style={{ background: '#000', color: '#fff', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>

          {/* Hamburguesa */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px', flexShrink: 0 }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#facc15' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? 'transparent' : '#fff', transition: 'all 0.3s' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: menuOpen ? '#facc15' : '#fff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>

          {/* Logo */}
          <Link href="/" style={{ fontSize: '15px', fontWeight: 800, textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ color: '#facc15', fontSize: '18px' }}>⚙</span>
            <span>MCA</span>
          </Link>

          {/* Barra búsqueda desktop */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <SearchBar />
          </div>

          {/* Carrito */}
          <button onClick={() => setCartOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', flexShrink: 0 }}>
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
        <div style={{ background: '#111', overflow: 'hidden', maxHeight: menuOpen ? '500px' : '0', transition: 'max-height 0.35s ease' }}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

            {/* Búsqueda en menú móvil */}
            <div style={{ marginBottom: '8px' }}>
              <SearchBar dark />
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