'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CarritoPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchCart(session.user.id)
    })
  }, [])

  async function fetchCart(userId: string) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(id, name, price, stock, images, slug)')
      .eq('user_id', userId)
    if (data) setItems(data)
    setLoading(false)
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
  }

  async function removeItem(itemId: string) {
    await supabase.from('cart_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Mi carrito</h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>
        {items.length === 0 ? 'Tu carrito está vacío' : `${items.length} producto${items.length > 1 ? 's' : ''}`}
      </p>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '24px' }}>No tienes productos en el carrito</p>
          <Link href="/" style={{ background: '#000', color: '#facc15', padding: '12px 28px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}>
            Ver productos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>

          {/* Lista de items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Link href={`/productos/${item.products.slug}`}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.products.images?.[0] ? (
                      <img src={item.products.images[0]} alt={item.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>⚙️</div>
                    )}
                  </div>
                </Link>

                <div style={{ flex: 1 }}>
                  <Link href={`/productos/${item.products.slug}`} style={{ textDecoration: 'none' }}>
                    <p style={{ fontWeight: 700, color: '#111', fontSize: '15px', margin: '0 0 4px' }}>{item.products.name}</p>
                  </Link>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 12px' }}>
                    ${item.products.price.toLocaleString('es-CO')} c/u
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ width: '36px', height: '36px', background: '#f3f4f6', border: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 700 }}>−</button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.products.stock}
                      style={{ width: '36px', height: '36px', background: '#f3f4f6', border: 'none', fontSize: '16px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
                    ${(item.products.price * item.quantity).toLocaleString('es-CO')}
                  </p>
                  <button onClick={() => removeItem(item.id)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', position: 'sticky', top: '80px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Resumen del pedido</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>{item.products.name} x{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>${(item.products.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#111' }}>${subtotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <Link href="/checkout"
              style={{ display: 'block', background: '#000', color: '#facc15', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}>
              Proceder al pago →
            </Link>
            <Link href="/"
              style={{ display: 'block', background: '#f3f4f6', color: '#374151', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', marginTop: '10px' }}>
              Seguir comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}