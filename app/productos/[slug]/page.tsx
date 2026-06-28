'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase, cartEvents } from '@/lib/supabase'

export default function ProductoPage() {
  const pathname = usePathname()
  const slug = pathname.split('/').pop()

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    if (slug) fetchProduct()
  }, [slug])

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('slug', slug)
      .eq('active', true)
      .single()
    if (data) setProduct(data)
    setLoading(false)
  }

  async function addToCart() {
    if (!user) { window.location.href = '/login'; return }
    if (product.stock <= 0) return
    setAdding(true)
    const { data: existing } = await supabase
      .from('cart_items').select('*')
      .eq('user_id', user.id).eq('product_id', product.id)
      .maybeSingle()
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        alert(`Solo hay ${product.stock} unidades disponibles`)
        setAdding(false)
        return
      }
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
    } else {
      if (quantity > product.stock) {
        alert(`Solo hay ${product.stock} unidades disponibles`)
        setAdding(false)
        return
      }
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: product.id, quantity })
    }
    setAdding(false)
    setAdded(true)
    cartEvents.emit()
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando...</div>
  )

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <p style={{ color: '#9ca3af', fontSize: '18px' }}>Producto no encontrado.</p>
      <Link href="/" style={{ color: '#ca8a04', fontWeight: 600 }}>← Volver al catálogo</Link>
    </div>
  )

  const images = product.images?.length > 0 ? product.images : null
  const specs = product.specs?.filter((s: any) => s.key && s.value) || []

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#9ca3af', marginBottom: '32px', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#ca8a04', textDecoration: 'none' }}>Inicio</Link>
        <span>›</span>
        {product.categories && <><span>{product.categories.name}</span><span>›</span></>}
        <span style={{ color: '#374151' }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>

        {/* Galería de imágenes */}
        <div>
          <div style={{ background: '#f3f4f6', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            {images ? (
              <img src={images[selectedImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '80px' }}>⚙️</span>
            )}
          </div>
          {/* Miniaturas */}
          {images && images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {images.map((img: string, i: number) => (
                <div key={i} onClick={() => setSelectedImage(i)}
                  style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: selectedImage === i ? '2.5px solid #000' : '2px solid #e5e7eb', flexShrink: 0 }}>
                  <img src={img} alt={`foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info del producto */}
        <div>
          {product.categories && (
            <span style={{ fontSize: '12px', color: '#ca8a04', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {product.categories.name}
            </span>
          )}
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111', margin: '8px 0 16px', lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p style={{ fontSize: '40px', fontWeight: 900, color: '#111', margin: '0 0 8px' }}>
            ${product.price.toLocaleString('es-CO')}
          </p>
          <p style={{ fontSize: '14px', color: product.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600, marginBottom: '24px' }}>
            {product.stock > 0 ? `✓ ${product.stock} unidades disponibles` : '✗ Agotado'}
          </p>

          {product.description && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.7, marginBottom: '8px' }}>
                {product.description}
              </p>
              {specs.length > 0 && (
                <a href="#ficha" style={{ fontSize: '14px', color: '#ca8a04', fontWeight: 700, textDecoration: 'none' }}>
                  Ver ficha técnica ↓
                </a>
              )}
            </div>
          )}

          {/* Cantidad */}
          {product.stock > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>Cantidad</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: '40px', height: '40px', background: '#f3f4f6', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 700 }}>−</button>
                <span style={{ width: '48px', textAlign: 'center', fontSize: '16px', fontWeight: 700 }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{ width: '40px', height: '40px', background: '#f3f4f6', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 700 }}>+</button>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <button onClick={addToCart} disabled={product.stock === 0 || adding}
              style={{ background: added ? '#16a34a' : '#000', color: added ? '#fff' : '#facc15', border: 'none', borderRadius: '10px', padding: '14px 28px', fontSize: '16px', fontWeight: 800, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', opacity: product.stock === 0 ? 0.5 : 1, transition: 'background 0.3s' }}>
              {added ? '✓ Agregado al carrito' : adding ? 'Agregando...' : '🛒 Agregar al carrito'}
            </button>
            <Link href="/carrito"
              style={{ background: '#f3f4f6', color: '#111', borderRadius: '10px', padding: '14px 28px', fontSize: '15px', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
              Ver carrito →
            </Link>
          </div>
        </div>
      </div>

      {/* Especificaciones técnicas */}
      {specs.length > 0 && (
        <div id="ficha" style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '40px', scrollMarginTop: '80px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>Ficha técnica</h2>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#f9fafb', padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Especificaciones</span>
            </div>
            {specs.map((spec: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: i < specs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                <div style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280', borderRight: '1px solid #e5e7eb', background: '#fafafa' }}>
                  {spec.key}
                </div>
                <div style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 600, color: '#111' }}>
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}