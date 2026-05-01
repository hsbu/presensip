import React from 'react'

interface Props {
  variant: 'neon' | 'red'
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ variant, children, onClick, disabled, loading, fullWidth }: Props) {
  const bg = variant === 'neon' ? 'var(--neon)' : 'var(--red)'
  const color = variant === 'neon' ? '#050505' : '#ffffff'
  const shadow = variant === 'neon' ? '0px 4px 12px rgba(142, 255, 113, 0.25)' : 'none'
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: bg, color, border: 'none', borderRadius: 14,
        padding: '16px', fontSize: 15, fontWeight: 800,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'Barlow', sans-serif",
        boxShadow: shadow,
      }}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, border: `2px solid ${color}`,
          borderTopColor: 'transparent', borderRadius: '50%',
          display: 'inline-block', animation: 'btnspin 0.7s linear infinite',
        }} />
      )}
      {children}
      <style>{`@keyframes btnspin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}
