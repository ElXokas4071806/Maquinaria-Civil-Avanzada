'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegistroPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!form.full_name || !form.email || !form.password) {
      setError('Todos los campos son obligatorios'); return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden'); return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return
    }
    setLoading(true)
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        role: 'customer'
      })
    }
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>¡Cuenta creada!</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Revisa tu correo para confirmar tu cuenta, luego inicia sesión.
          </p>
          <Link href="/login" style={{ background: '#000', color: '#facc15', padding: '12px 32px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>Crear cuenta</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: '#ca8a04', fontWeight: 600 }}>Inicia sesión</Link>
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nombre completo</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Tu nombre"
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Correo electrónico</label>
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="correo@ejemplo.com"
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Contraseña</label>
            <input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Confirmar contraseña</label>
            <input type="password" value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Repite tu contraseña"
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ marginTop: '24px', width: '100%', background: '#000', color: '#facc15', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>
    </div>
  )
}