import { useState } from 'react'

const base: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, fontFamily: 'var(--font-family)', fontWeight: 600,
  border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)',
  transition: 'all var(--duration-fast) var(--ease-default)',
  minHeight: 'var(--touch-target-min)',
}

const variants: Record<string, React.CSSProperties> = {
  primary:     { background: 'var(--color-brand-primary)', color: '#fff' },
  secondary:   { background: 'transparent', color: 'var(--color-brand-primary)', border: '2px solid var(--color-brand-primary)' },
  ghost:       { background: 'transparent', color: 'var(--color-brand-primary)', border: '2px solid transparent' },
  destructive: { background: 'var(--color-error)', color: '#fff' },
}

const sizes: Record<string, React.CSSProperties> = {
  sm:  { fontSize: 12, padding: '0 12px', height: 32, minHeight: 32 },
  md:  { fontSize: 14, padding: '0 20px', height: 44 },
  lg:  { fontSize: 16, padding: '0 28px', height: 52 },
  fw:  { fontSize: 14, padding: '0 20px', height: 44, width: '100%' },
}

function Btn({ variant = 'primary', size = 'md', disabled = false, loading = false, label = 'Continuar', icon }: {
  variant?: string; size?: string; disabled?: boolean; loading?: boolean; label?: string; icon?: string
}) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...base, ...variants[variant], ...sizes[size],
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => {
        if (disabled || loading) return
        const el = e.currentTarget
        if (variant === 'primary') el.style.background = '#0619AD'
        if (variant === 'secondary' || variant === 'ghost') { el.style.background = 'var(--color-blue-50)' }
        if (variant === 'destructive') el.style.background = '#dc2626'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        if (variant === 'primary') el.style.background = 'var(--color-brand-primary)'
        if (variant === 'secondary' || variant === 'ghost') el.style.background = 'transparent'
        if (variant === 'destructive') el.style.background = 'var(--color-error)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {icon === 'leading' && <span>←</span>}
      {loading ? (
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      ) : label}
      {icon === 'trailing' && <span>→</span>}
    </button>
  )
}

export default function SectionButtons() {
  const [loadingDemo, setLoadingDemo] = useState(false)

  return (
    <section id="buttons" className="ds-section">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="ds-section-title">07</div>
      <h2 className="ds-section-heading">Botões</h2>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Variantes</div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Btn variant="primary" label="Primary" />
          <Btn variant="secondary" label="Secondary" />
          <Btn variant="ghost" label="Ghost" />
          <Btn variant="destructive" label="Destructive" />
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Tamanhos — Primary</div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn size="sm" label="Small" />
          <Btn size="md" label="Medium" />
          <Btn size="lg" label="Large" />
        </div>
        <div style={{ marginTop: 'var(--space-3)', maxWidth: 360 }}>
          <Btn size="fw" label="Full Width" />
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Estados</div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Btn label="Default" />
          <Btn label="Disabled" disabled />
          <Btn label={loadingDemo ? 'Carregando...' : 'Clique p/ Loading'} loading={loadingDemo}
            {...{ onClick: () => { setLoadingDemo(true); setTimeout(() => setLoadingDemo(false), 2000) } }} />
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Com ícones</div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Btn icon="leading" label="Voltar" />
          <Btn icon="trailing" label="Avançar" />
          <button style={{ ...base, ...variants.primary, ...sizes.md, width: 44, padding: 0, fontSize: 20 }}>+</button>
          <button style={{ ...base, ...variants.secondary, ...sizes.md, width: 44, padding: 0, fontSize: 20 }}>×</button>
        </div>
      </div>
    </section>
  )
}
