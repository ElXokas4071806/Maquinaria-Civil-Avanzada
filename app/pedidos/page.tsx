'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Suspense } from 'react'

function PedidosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nuevoPedido = searchParams.get('nuevo')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      fetchOrders(session.user.id)
    })
  }, [])

  async function fetchOrders(userId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, images))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    pendiente: { bg: '#fffbeb', color: '#ca8a04' },
    confirmado: { bg: '#eff6ff', color: '#2563eb' },
    enviado: { bg: '#f5f3ff', color: '#7c3aed' },
    entregado: { bg: '#dcfce7', color: '#16a34a' },
    cancelado: { bg: '#fef2f2', color: '#dc2626' },
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Mis pedidos</h1>
      <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '32px' }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>

      {nuevoPedido && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <p style={{ fontWeight: 700, color: '#16a34a', margin: 0 }}>¡Pedido #{nuevoPedido} confirmado!</p>
            <p style={{ fontSize: '13px', color: '#15803d', margin: 0 }}>Te contactaremos pronto para coordinar la entrega.</p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
          <p style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '24px' }}>No tienes pedidos aún.</p>
          <Link href="/" style={{ background: '#000', color: '#facc15', padding: '12px 28px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}>
            Ver productos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => {
            const sc = statusColors[order.status] || { bg: '#f3f4f6', color: '#6b7280' }
            return (
              <div key={order.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontWeight: 800, color: '#111', margin: '0 0 4px', fontSize: '16px' }}>Pedido #{order.id.slice(0, 8)}</p>
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '999px', fontWeight: 700, background: sc.bg, color: sc.color }}>
                    {order.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                        {item.products?.images?.[0] ? (
                          <img src={item.products.images[0]} alt={item.products.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>⚙️</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111', margin: 0 }}>{item.products?.name}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>x{item.quantity} · ${item.unit_price?.toLocaleString('es-CO')} c/u</p>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>${(item.unit_price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 2px' }}>Dirección de envío</p>
                    <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{order.shipping_address}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 2px' }}>Total</p>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: 0 }}>${order.total?.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PedidosPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando...</div>}>
      <PedidosContent />
    </Suspense>
  )
}