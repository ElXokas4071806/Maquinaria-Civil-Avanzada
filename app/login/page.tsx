'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (!form.email || !form.password) { setError('Completa todos los campos'); return }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    router.push('/')
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '4px' }}>Iniciar sesión</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>
          ¿No tienes cuenta? <Link href="/registro" style={{ color: '#ca8a04', fontWeight: 600 }}>Regístrate gratis</Link>
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Tu contraseña"
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ marginTop: '24px', width: '100%', background: '#000', color: '#facc15', padding: '12px', borderRadius: '8px', fontSize: '15px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}