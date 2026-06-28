'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, cartEvents } from '@/lib/supabase'

interface CartItem {
  id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    images: string[]
    slug: string
  }
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchCart(session.user.id)
    })
  }, [open])

  async function fetchCart(userId: string) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(id, name, price, images, slug)')
      .eq('user_id', userId)
    if (data) setItems(data)
  }

  async function removeItem(itemId: string) {
    await supabase.from('cart_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
    cartEvents.emit()
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
    cartEvents.emit()
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 40, opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.3s ease'
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '380px',
        background: '#fff', zIndex: 50, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s ease',
        display: 'flex', flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Carrito</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#6b7280', lineHeight: 1 }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <p style={{ color: '#9ca3af', fontSize: '15px' }}>Tu carrito está vacío</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.products.images?.[0] ? (
                      <img src={item.products.images[0]} alt={item.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>⚙️</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>{item.products.name}</p>
                    <p style={{ fontSize: '13px', color: '#ca8a04', fontWeight: 700, margin: '0 0 8px' }}>
                      ${item.products.price.toLocaleString('es-CO')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ width: '28px', height: '28px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>−</button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ width: '28px', height: '28px', background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>+</button>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>
                        ${(item.products.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Subtotal</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#ca8a04' }}>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <Link href="/carrito" onClick={onClose}
              style={{ display: 'block', background: '#f3f4f6', color: '#111', padding: '12px', borderRadius: '8px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', marginBottom: '10px', fontSize: '14px' }}>
              Ver carrito
            </Link>
            <Link href="/checkout" onClick={onClose}
              style={{ display: 'block', background: '#000', color: '#facc15', padding: '12px', borderRadius: '8px', fontWeight: 800, textAlign: 'center', textDecoration: 'none', fontSize: '14px' }}>
              Finalizar compra
            </Link>
          </div>
        )}
      </div>
    </>
  )
}