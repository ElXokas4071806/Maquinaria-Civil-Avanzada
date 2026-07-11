'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'

interface Category { id: string; name: string; slug: string }
interface Product { id: string; name: string; price: number; stock: number; active: boolean; featured: boolean; sort_order: number; categories: { name: string } | null }

export default function AdminPage() {
  const [tab, setTab] = useState<'categorias' | 'productos' | 'pedidos'>('categorias')
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState<{
    name: string; description: string; price: string; stock: string
    category_id: string; images: string[]; specs: { key: string; value: string }[]; active: boolean; featured: boolean
  }>({ name: '', description: '', price: '', stock: '', category_id: '', images: [], specs: [], active: true, featured: false })
  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  useEffect(() => { fetchCategories(); fetchProducts() }, [])

  function toSlug(text: string) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    await supabase.from('categories').insert({ name: newCatName.trim(), slug: toSlug(newCatName) })
    setNewCatName('')
    await fetchCategories()
    setSavingCat(false)
  }

  async function handleEditCategory() {
    if (!editingCat || !editCatName.trim()) return
    setSavingCat(true)
    await supabase.from('categories').update({ name: editCatName.trim(), slug: toSlug(editCatName) }).eq('id', editingCat.id)
    setEditingCat(null)
    setEditCatName('')
    await fetchCategories()
    setSavingCat(false)
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    await supabase.from('categories').delete().eq('id', id)
    await fetchCategories()
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*, categories(name)').order('sort_order', { ascending: true })
    if (data) setProducts(data)
  }

  function openNewProduct() {
    setEditingProduct(null)
    setProductForm({ name: '', description: '', price: '', stock: '', category_id: '', images: [], specs: [], active: true, featured: false })
    setShowProductForm(true)
  }

  function openEditProduct(p: any) {
    setEditingProduct(p)
    setProductForm({
      name: p.name, description: p.description || '', price: String(p.price),
      stock: String(p.stock), category_id: p.category_id || '',
      images: p.images || [], specs: p.specs || [], active: p.active, featured: p.featured || false
    })
    setShowProductForm(true)
  }

  async function handleImageUpload(files: FileList) {
    setUploadingImages(true)
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `producto-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, compressed, { cacheControl: '3600', upsert: false })

        if (uploadError) {
          alert('Error subiendo: ' + uploadError.message)
          continue
        }

        const { data: publicData } = supabase.storage.from('productos').getPublicUrl(uploadData.path)
        newUrls.push(publicData.publicUrl)
      } catch (err: any) {
        alert('Error: ' + err.message)
      }
    }

    setProductForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }))
    setUploadingImages(false)
  }

  async function handleSaveProduct() {
    if (!productForm.name || !productForm.price) return
    setSavingProduct(true)
    const payload = {
      name: productForm.name, slug: toSlug(productForm.name),
      description: productForm.description, price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 0, category_id: productForm.category_id || null,
      images: productForm.images.filter(i => i.trim() !== ''),
      specs: productForm.specs.filter(s => s.key.trim() !== ''),
      active: productForm.active,
      featured: productForm.featured
    }
    if (editingProduct) await supabase.from('products').update(payload).eq('id', editingProduct.id)
    else await supabase.from('products').insert(payload)
    await fetchProducts()
    setShowProductForm(false)
    setSavingProduct(false)
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    await fetchProducts()
  }

  async function handleDrop(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    const reordered = [...products]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setProducts(reordered)
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('products').update({ sort_order: i }).eq('id', reordered[i].id)
    }
  }

  async function toggleActive(p: any) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    await fetchProducts()
  }

  const tabs = [
    { key: 'categorias', label: '📁 Categorías' },
    { key: 'productos', label: '📦 Productos' },
    { key: 'pedidos', label: '🧾 Pedidos' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f8' }}>
      <div style={{ background: '#000', color: '#fff', padding: '32px 40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Panel <span style={{ color: '#facc15' }}>Admin</span></h1>
        <p style={{ color: '#9ca3af', marginTop: '4px', fontSize: '14px' }}>Gestiona tu tienda de Maquinaria Civil Avanzada</p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Categorías', value: categories.length, icon: '📁' },
            { label: 'Productos', value: products.length, icon: '📦' },
            { label: 'Activos', value: products.filter(p => p.active).length, icon: '✅' },
            { label: 'Destacados', value: products.filter(p => p.featured).length, icon: '⭐' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px' }}>{stat.icon}</span>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#111' }}>{stat.value}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', border: 'none', background: tab === t.key ? '#000' : '#fff', color: tab === t.key ? '#facc15' : '#6b7280', boxShadow: tab === t.key ? 'none' : '0 1px 3px rgba(0,0,0,0.1)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'categorias' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Categorías</h2>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input type="text" placeholder="Nombre de la categoría" value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none' }} />
              <button onClick={handleAddCategory} disabled={savingCat}
                style={{ background: '#000', color: '#facc15', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                {savingCat ? 'Guardando...' : '+ Agregar'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay categorías aún.</p>}
              {categories.map(cat => (
                <div key={cat.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px' }}>
                  {editingCat?.id === cat.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" value={editCatName}
                        onChange={e => setEditCatName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleEditCategory()}
                        style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none' }} />
                      <button onClick={handleEditCategory} disabled={savingCat}
                        style={{ background: '#000', color: '#facc15', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        {savingCat ? '...' : 'Guardar'}
                      </button>
                      <button onClick={() => setEditingCat(null)}
                        style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>📁</span>
                        <span style={{ fontWeight: 600, color: '#111' }}>{cat.name}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>/{cat.slug}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingCat(cat); setEditCatName(cat.name) }}
                          style={{ background: '#f3f4f6', color: '#111', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'productos' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '28px' }}>
            {!showProductForm ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Productos</h2>
                  <button onClick={openNewProduct}
                    style={{ background: '#000', color: '#facc15', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                    + Nuevo producto
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {products.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay productos aún.</p>}
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px' }}>Arrastra los productos para reordenarlos.</p>
                  {products.map((p, index) => (
                    <div key={p.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={e => { e.preventDefault(); setDragOver(index) }}
                      onDrop={() => { handleDrop(dragIndex!, index); setDragIndex(null); setDragOver(null) }}
                      onDragEnd={() => { setDragIndex(null); setDragOver(null) }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dragOver === index ? '#fffbeb' : '#f9fafb', border: dragOver === index ? '1.5px dashed #facc15' : '1px solid #e5e7eb', borderRadius: '10px', padding: '14px 18px', cursor: 'grab', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>📦</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ fontWeight: 700, color: '#111', margin: 0, fontSize: '15px' }}>{p.name}</p>
                            {p.featured && <span style={{ fontSize: '11px', background: '#fffbeb', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>⭐ Destacado</span>}
                          </div>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{p.categories?.name || 'Sin categoría'} · ${p.price.toLocaleString('es-CO')} · {p.stock} en stock</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '999px', fontWeight: 700, background: p.active ? '#dcfce7' : '#f3f4f6', color: p.active ? '#16a34a' : '#9ca3af' }}>
                          {p.active ? 'Activo' : 'Oculto'}
                        </span>
                        <button onClick={() => openEditProduct(p)}
                          style={{ background: '#f3f4f6', color: '#111', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => toggleActive(p)}
                          style={{ background: '#fffbeb', color: '#ca8a04', border: '1px solid #fde68a', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          {p.active ? 'Ocultar' : 'Activar'}
                        </button>
                        <button onClick={() => handleDeleteProduct(p.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ maxWidth: '580px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>
                  {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Nombre *</label>
                    <input type="text" placeholder="Ej: Taladro Bosch 700W" value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Precio COP *</label>
                      <input type="number" placeholder="Ej: 250000" value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Stock</label>
                      <input type="number" placeholder="Ej: 10" value={productForm.stock}
                        onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Descripción</label>
                    <textarea placeholder="Descripción del producto" value={productForm.description}
                      onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                      rows={3}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Categoría</label>
                    <select value={productForm.category_id}
                      onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Sin categoría</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Fotos del producto</label>
                    {productForm.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {productForm.images.map((url, i) => (
                          <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <img src={url} alt={`foto ${i + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            <button onClick={() => setProductForm({ ...productForm, images: productForm.images.filter((_, j) => j !== i) })}
                              style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '999px', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ display: 'block', background: uploadingImages ? '#f3f4f6' : '#000', color: uploadingImages ? '#9ca3af' : '#facc15', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: uploadingImages ? 'not-allowed' : 'pointer', textAlign: 'center' }}>
                      {uploadingImages ? 'Subiendo...' : '📁 Seleccionar fotos'}
                      <input type="file" accept="image/*" multiple
                        style={{ display: 'none' }}
                        disabled={uploadingImages}
                        onChange={e => e.target.files && handleImageUpload(e.target.files)} />
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>Especificaciones técnicas</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {productForm.specs.map((spec, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="text" placeholder="Atributo (ej: Potencia)" value={spec.key}
                            onChange={e => {
                              const sp = [...productForm.specs]
                              sp[i] = { ...sp[i], key: e.target.value }
                              setProductForm({ ...productForm, specs: sp })
                            }}
                            style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                          <input type="text" placeholder="Valor (ej: 700W)" value={spec.value}
                            onChange={e => {
                              const sp = [...productForm.specs]
                              sp[i] = { ...sp[i], value: e.target.value }
                              setProductForm({ ...productForm, specs: sp })
                            }}
                            style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                          <button onClick={() => setProductForm({ ...productForm, specs: productForm.specs.filter((_, j) => j !== i) })}
                            style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>
                      ))}
                      <button onClick={() => setProductForm({ ...productForm, specs: [...productForm.specs, { key: '', value: '' }] })}
                        style={{ background: '#f3f4f6', color: '#374151', border: '1.5px dashed #d1d5db', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        + Agregar especificación
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" id="active" checked={productForm.active}
                        onChange={e => setProductForm({ ...productForm, active: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="active" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Producto activo (visible en tienda)
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="checkbox" id="featured" checked={productForm.featured}
                        onChange={e => setProductForm({ ...productForm, featured: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="featured" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        ⭐ Producto destacado (aparece en carrusel)
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={handleSaveProduct} disabled={savingProduct || uploadingImages}
                    style={{ background: '#000', color: '#facc15', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>
                    {savingProduct ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button onClick={() => setShowProductForm(false)}
                    style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'pedidos' && <PedidosAdmin />}
      </div>
    </div>
  )
}

function PedidosAdmin() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('orders')
      .select('*, order_items(*, products(name))')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setOrders(data) })
  }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function deleteOrder(id: string) {
    if (!confirm('¿Eliminar este pedido?')) return
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    pendiente: { bg: '#fffbeb', color: '#ca8a04' },
    confirmado: { bg: '#eff6ff', color: '#2563eb' },
    enviado: { bg: '#f5f3ff', color: '#7c3aed' },
    entregado: { bg: '#dcfce7', color: '#16a34a' },
    cancelado: { bg: '#fef2f2', color: '#dc2626' },
  }

  return (
    <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '28px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Pedidos</h2>
      {orders.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No hay pedidos aún.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {orders.map(order => {
          const sc = statusColors[order.status] || { bg: '#f3f4f6', color: '#6b7280' }
          return (
            <div key={order.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#111', margin: '0 0 4px' }}>#{order.id.slice(0, 8)}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    {order.phone || 'Sin teléfono'} · {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </p>
                  {order.shipping_address && (
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>📍 {order.shipping_address}</p>
                  )}
                  {order.notes && (
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>📝 {order.notes}</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700, background: sc.bg, color: sc.color }}>
                    {order.status}
                  </span>
                  <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                    style={{ border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                    {['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button onClick={() => deleteOrder(order.id)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Productos del pedido */}
              {order.order_items && order.order_items.length > 0 && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {order.order_items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: '#374151' }}>• {item.products?.name || 'Producto'} x{item.quantity}</span>
                        <span style={{ fontWeight: 600, color: '#111' }}>${(item.unit_price * item.quantity).toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#111' }}>${order.total?.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}