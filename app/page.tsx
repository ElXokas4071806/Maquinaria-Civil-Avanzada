'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  images: string[]
  categories: { name: string } | null
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    fetchCategories()
    fetchProducts()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
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
  }

  return (
    <div style={{ width: '100%' }}>

      {/* Hero */}
      <div style={{ background: '#000', color: '#fff', width: '100%', padding: '60px 24px', textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '12px' }}>
          Maquinaria Civil <span style={{ color: '#facc15' }}>Avanzada</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '18px' }}>
          Herramientas y equipos de alta calidad para tu obra
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <button onClick={() => handleCategoryChange('all')}
            style={{ padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: selectedCategory === 'all' ? '#000' : '#fff', color: selectedCategory === 'all' ? '#facc15' : '#374151', borderColor: selectedCategory === 'all' ? '#000' : '#d1d5db' }}>
            Todos
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => handleCategoryChange(cat.slug, cat.id)}
              style={{ padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: selectedCategory === cat.slug ? '#000' : '#fff', color: selectedCategory === cat.slug ? '#facc15' : '#374151', borderColor: selectedCategory === cat.slug ? '#000' : '#d1d5db' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {products.map(product => (
              <div key={product.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <Link href={`/productos/${product.slug}`}>
                  <div style={{ background: '#f3f4f6', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '48px' }}>⚙️</span>
                    )}
                  </div>
                </Link>
                <div style={{ padding: '16px' }}>
                  {product.categories && (
                    <span style={{ fontSize: '11px', color: '#ca8a04', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {product.categories.name}
                    </span>
                  )}
                  <Link href={`/productos/${product.slug}`}>
                    <h3 style={{ fontWeight: 700, color: '#111', marginTop: '4px', fontSize: '15px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h3>
                  </Link>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.description}
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                    <span style={{ fontSize: '12px', color: product.stock > 0 ? '#16a34a' : '#dc2626' }}>
                      {product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id, product.stock)}
                    disabled={product.stock === 0 || addingToCart === product.id}
                    style={{ marginTop: '12px', width: '100%', background: product.stock === 0 ? '#d1d5db' : '#000', color: product.stock === 0 ? '#9ca3af' : '#facc15', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}>
                    {addingToCart === product.id ? 'Agregando...' : 'Agregar al carrito'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}