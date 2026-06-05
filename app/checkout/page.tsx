'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', city: '', notes: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      fetchCart(session.user.id)
      fetchProfile(session.user.id)
    })
  }, [])

  async function fetchCart(userId: string) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(id, name, price, images, stock)')
      .eq('user_id', userId)
    if (data) {
      console.log('carrito cargado:', JSON.stringify(data))
      setItems(data)
    }
    setLoading(false)
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setForm(f => ({ ...f, full_name: data.full_name || '', phone: data.phone || '', address: data.address || '' }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0)

  async function handlePlaceOrder() {
    setError('')
    if (!form.full_name || !form.phone || !form.address || !form.city) {
      setError('Completa todos los campos obligatorios'); return
    }
    setPlacing(true)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pendiente',
        total: subtotal,
        shipping_address: `${form.address}, ${form.city}`,
        phone: form.phone,
        notes: form.notes
      })
      .select().single()

    if (orderError || !order) { setError('Error al crear el pedido'); setPlacing(false); return }

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.products.id,
      quantity: item.quantity,
      unit_price: item.products.price
    }))

    await supabase.from('order_items').insert(orderItems)

    // Actualizar stock
    console.log('items antes de actualizar stock:', JSON.stringify(items.map(i => ({ id: i.products?.id, name: i.products?.name, qty: i.quantity }))))
    for (const item of items) {
      const { data: prod, error: prodError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.products.id)
        .maybeSingle()
      console.log('producto:', item.products.id, 'stock actual:', prod?.stock, 'cantidad:', item.quantity, 'error:', prodError)
      if (prod) {
        const { error: updateError } = await supabase.from('products')
          .update({ stock: prod.stock - item.quantity })
          .eq('id', item.products.id)
        console.log('update error:', updateError)
      }
    }

    // Vaciar carrito
    await supabase.from('cart_items').delete().eq('user_id', user.id)

    // Armar mensaje de WhatsApp
    const itemsTexto = items.map(item =>
      `• ${item.products.name} x${item.quantity} = $${(item.products.price * item.quantity).toLocaleString('es-CO')}`
    ).join('\n')

    const mensaje = encodeURIComponent(
      `🔧 *Nuevo pedido - Maquinaria Civil Avanzada*\n\n` +
      `📋 Pedido #${order.id.slice(0, 8)}\n` +
      `👤 Cliente: ${form.full_name}\n` +
      `📞 Teléfono: ${form.phone}\n` +
      `📍 Dirección: ${form.address}, ${form.city}\n` +
      `${form.notes ? `📝 Notas: ${form.notes}\n` : ''}` +
      `\n*Productos:*\n${itemsTexto}\n\n` +
      `💰 *Total: $${subtotal.toLocaleString('es-CO')}*`
    )

    const tuNumero = '573208531761'
    window.open(`https://wa.me/${tuNumero}?text=${mensaje}`, '_blank')

    router.push(`/pedidos?nuevo=${order.id.slice(0, 8)}`)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando...</div>

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '24px' }}>Tu carrito está vacío.</p>
      <Link href="/" style={{ background: '#000', color: '#facc15', padding: '12px 28px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}>
        Ver productos
      </Link>
    </div>
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Finalizar pedido</h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>Completa tus datos de envío</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>

        {/* Formulario */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>Datos de envío</h2>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre completo *</label>
              <input type="text" value={form.full_name} placeholder="Tu nombre completo"
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Teléfono *</label>
              <input type="tel" value={form.phone} placeholder="Ej: 3001234567"
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Dirección *</label>
              <input type="text" value={form.address} placeholder="Calle, carrera, avenida..."
                onChange={e => setForm({ ...form, address: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Ciudad *</label>
              <input type="text" value={form.city} placeholder="Ej: Bogotá"
                onChange={e => setForm({ ...form, city: e.target.value })}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Notas adicionales</label>
              <textarea value={form.notes} placeholder="Instrucciones especiales, referencias..."
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Resumen</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {item.products.images?.[0] ? (
                      <img src={item.products.images[0]} alt={item.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', margin: 0 }}>{item.products.name}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>x{item.quantity}</p>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>${(item.products.price * item.quantity).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '24px', fontWeight: 900 }}>${subtotal.toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>

          <button onClick={handlePlaceOrder} disabled={placing}
            style={{ width: '100%', background: '#000', color: '#facc15', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '16px', fontWeight: 800, cursor: placing ? 'not-allowed' : 'pointer', opacity: placing ? 0.7 : 1 }}>
            {placing ? 'Procesando...' : 'Confirmar pedido ✓'}
          </button>
          <Link href="/carrito"
            style={{ display: 'block', textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '12px', textDecoration: 'none' }}>
            ← Volver al carrito
          </Link>
        </div>
      </div>
    </div>
  )
}