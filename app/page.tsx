'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, cartEvents } from '@/lib/supabase'
import CartDrawer from '@/components/CartDrawer'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  images: string[]
  featured: boolean
  categories: { name: string } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    fetchCategories()
    fetchProducts()
    fetchFeatured()
  }, [])

  useEffect(() => {
    if (featuredProducts.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredProducts.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [featuredProducts])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function fetchFeatured() {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
    if (data) setFeaturedProducts(data)
  }

  async function fetchProducts(categoryId?: string) {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (categoryId) query = query.eq('category_id', categoryId)
    const { data } = await query
    if (data) setProducts(data)
    setLoading(false)
  }

  async function handleCategoryChange(slug: string, id?: string) {
    setSelectedCategory(slug)
    if (slug === 'all') fetchProducts()
    else fetchProducts(id)
  }

  async function addToCart(productId: string, stock: number) {
    if (!user) { window.location.href = '/login'; return }
    if (stock <= 0) return
    setAddingToCart(productId)
    const { data: existing } = await supabase
      .from('cart_items').select('*')
      .eq('user_id', user.id).eq('product_id', productId)
      .maybeSingle()
    if (existing) {
      if (existing.quantity >= stock) {
        alert('No hay más unidades disponibles')
        setAddingToCart(null)
        return
      }
      await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: 1 })
    }
    setAddingToCart(null)
    cartEvents.emit()
    setCartOpen(true)
    setTimeout(() => setCartOpen(false), 5000)
  }

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ background: '#000', color: '#fff', width: '100%', padding: isMobile ? '40px 16px' : '60px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: 800, marginBottom: '12px' }}>
          Maquinaria Civil <span style={{ color: '#facc15' }}>Avanzada</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: isMobile ? '15px' : '18px' }}>
          Herramientas y equipos de alta calidad para tu obra
        </p>
      </div>

      {/* Carrusel de destacados */}
      {featuredProducts.length > 0 && (
        <div style={{ background: '#f9fafb', padding: isMobile ? '32px 0' : '48px 0', marginBottom: '32px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 60px' }}>
            <p style={{ color: '#ca8a04', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>
              Productos destacados
            </p>
            <div style={{ position: 'relative' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${currentSlide * 100}%)` }}>
                  {featuredProducts.map((product) => (
                    <div key={product.id} style={{ minWidth: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '48px', alignItems: 'center', padding: isMobile ? '0 40px' : '0', textAlign: isMobile ? 'center' : 'left' }}>
                      <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: isMobile ? '260px' : 'none', margin: isMobile ? '0 auto' : '0', width: isMobile ? '80%' : '100%' }}>
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '80px' }}>⚙️</span>
                        )}
                      </div>
                      <div>
                        {product.categories && (
                          <span style={{ fontSize: '12px', color: '#ca8a04', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {product.categories.name}
                          </span>
                        )}
                        <h2 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 800, color: '#111', margin: '8px 0 12px', lineHeight: 1.2 }}>
                          {product.name}
                        </h2>
                        {product.description && !isMobile && (
                          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                            {product.description.slice(0, 120)}{product.description.length > 120 ? '...' : ''}
                          </p>
                        )}
                        <p style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 900, color: '#111', marginBottom: '20px' }}>
                          ${product.price.toLocaleString('es-CO')}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                          <Link href={`/productos/${product.slug}`}
                            style={{ background: '#000', color: '#facc15', padding: isMobile ? '10px 20px' : '12px 28px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', fontSize: '14px' }}>
                            Ver producto
                          </Link>
                          <button onClick={() => addToCart(product.id, product.stock)}
                            disabled={product.stock === 0 || addingToCart === product.id}
                            style={{ background: 'transparent', color: '#111', border: '1.5px solid #111', padding: isMobile ? '10px 20px' : '12px 28px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                            {addingToCart === product.id ? 'Agregando...' : 'Agregar al carrito'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {featuredProducts.length > 1 && (
                <>
                  <button onClick={() => setCurrentSlide(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                    style={{ position: 'absolute', left: isMobile ? '0' : '-48px', top: '50%', transform: 'translateY(-50%)', background: '#000', color: '#facc15', border: 'none', borderRadius: '999px', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    ‹
                  </button>
                  <button onClick={() => setCurrentSlide(prev => (prev + 1) % featuredProducts.length)}
                    style={{ position: 'absolute', right: isMobile ? '0' : '-48px', top: '50%', transform: 'translateY(-50%)', background: '#000', color: '#facc15', border: 'none', borderRadius: '999px', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    ›
                  </button>
                </>
              )}

              {featuredProducts.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                  {featuredProducts.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      style={{ width: i === currentSlide ? '24px' : '8px', height: '8px', borderRadius: '999px', background: i === currentSlide ? '#000' : '#d1d5db', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px 40px' : '0 24px 60px' }}>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <button onClick={() => handleCategoryChange('all')}
            style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: selectedCategory === 'all' ? '#000' : '#fff', color: selectedCategory === 'all' ? '#facc15' : '#374151', borderColor: selectedCategory === 'all' ? '#000' : '#d1d5db' }}>
            Todos
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCategoryChange(cat.slug, cat.id)}
              style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: selectedCategory === cat.slug ? '#000' : '#fff', color: selectedCategory === cat.slug ? '#facc15' : '#374151', borderColor: selectedCategory === cat.slug ? '#000' : '#d1d5db' }}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Cargando productos...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <p style={{ color: '#9ca3af', fontSize: '18px' }}>No hay productos aún.</p>
            <Link href="/admin" style={{ color: '#ca8a04', fontSize: '14px' }}>Ir al panel admin →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: isMobile ? '12px' : '24px' }}>
            {products.map(product => (
              <div key={product.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <Link href={`/productos/${product.slug}`}>
                  <div style={{ background: '#f3f4f6', height: isMobile ? '160px' : '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
                    onMouseEnter={e => {
                      const img = e.currentTarget.querySelector('img') as HTMLImageElement
                      if (img) {
                        img.style.transform = 'scale(1.07)'
                        if (product.images?.[1]) img.src = product.images[1]
                      }
                    }}
                    onMouseLeave={e => {
                      const img = e.currentTarget.querySelector('img') as HTMLImageElement
                      if (img) {
                        img.style.transform = 'scale(1)'
                        if (product.images?.[0]) img.src = product.images[0]
                      }
                    }}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.4s ease', padding: '8px' }} />
                    ) : (
                      <span style={{ fontSize: isMobile ? '32px' : '48px' }}>⚙️</span>
                    )}
                  </div>
                </Link>
                <div style={{ padding: isMobile ? '10px' : '16px' }}>
                  {product.categories && (
                    <span style={{ fontSize: '10px', color: '#ca8a04', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {product.categories.name}
                    </span>
                  )}
                  <Link href={`/productos/${product.slug}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontWeight: 700, color: '#111', marginTop: '4px', fontSize: isMobile ? '13px' : '15px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', transition: 'color 0.2s', borderRadius: '4px', padding: '2px 4px', margin: '4px -4px 0' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ca8a04')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#111')}>
                      {product.name}
                    </h3>
                  </Link>
                  {!isMobile && (
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>
                  )}
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: isMobile ? '15px' : '20px', fontWeight: 800, color: '#111' }}>
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                    <span style={{ fontSize: '11px', color: product.stock > 0 ? '#16a34a' : '#dc2626' }}>
                      {product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id, product.stock)}
                    disabled={product.stock === 0 || addingToCart === product.id}
                    style={{ marginTop: '8px', width: '100%', background: product.stock === 0 ? '#d1d5db' : '#000', color: product.stock === 0 ? '#9ca3af' : '#facc15', padding: isMobile ? '8px' : '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer', overflow: 'hidden', position: 'relative', height: isMobile ? '34px' : '38px' }}
                    onMouseEnter={e => {
                      if (product.stock === 0) return
                      const text = e.currentTarget.querySelector('.btn-text') as HTMLElement
                      const icon = e.currentTarget.querySelector('.btn-icon') as HTMLElement
                      if (text) text.style.transform = 'translateY(-100%)'
                      if (icon) icon.style.transform = 'translateY(0%)'
                    }}
                    onMouseLeave={e => {
                      const text = e.currentTarget.querySelector('.btn-text') as HTMLElement
                      const icon = e.currentTarget.querySelector('.btn-icon') as HTMLElement
                      if (text) text.style.transform = 'translateY(0%)'
                      if (icon) icon.style.transform = 'translateY(100%)'
                    }}>
                    <span className="btn-text" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s ease' }}>
                      {addingToCart === product.id ? 'Agregando...' : 'Agregar al carrito'}
                    </span>
                    <span className="btn-icon" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translateY(100%)', transition: 'transform 0.3s ease' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        <line x1="12" y1="10" x2="12" y2="16"/><line x1="9" y1="13" x2="15" y2="13"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}