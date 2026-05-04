import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Button } from '../components/Button'
import { useIsMobile } from '../hooks/useIsMobile'

export function LoginPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign in failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  const brand = (
    <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <img
          src="/logo.png"
          alt="Presensip logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{
        fontFamily: "'Barlow', sans-serif", fontSize: 28, fontWeight: 900,
        color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1,
        marginBottom: 8,
      }}>Presensip</div>
      <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: '1.5' }}>
        Automated attendance<br />verification system
      </div>
    </div>
  )

  const form = (
    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
      <label style={labelStyle}>Email</label>
      <input
        type="email" placeholder="lecturer@university.ac.id" value={email}
        onChange={e => setEmail(e.target.value)} style={inputStyle}
      />

      <label style={{ ...labelStyle, marginTop: 20 }}>Password</label>
      <input
        type="password" placeholder="••••••••" value={password}
        onChange={e => setPassword(e.target.value)} style={inputStyle}
      />

      {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 10 }}>{error}</p>}

      <div style={{ marginTop: 24 }}>
        <Button variant="neon" onClick={handleSubmit} loading={loading} fullWidth>Sign In</Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        padding: '0 20px',
      }}>
        <div style={{ marginTop: 64, marginBottom: 0 }}>
          {brand}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 48 }}>
          {form}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#0b0b0b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--card)', border: '2px solid var(--border2)',
        borderRadius: 18, padding: '36px 32px 32px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
      }}>
        {brand}
        {form}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 800, color: 'var(--sub)',
  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, display: 'block',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--card)', border: '2px solid var(--border2)', borderRadius: 10,
  padding: '13px 14px', fontSize: 13, color: 'var(--text)', outline: 'none', width: '100%',
}
