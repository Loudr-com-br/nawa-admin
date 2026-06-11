import { useState } from 'react'

type Swatch = { name: string; hex: string; token: string; light?: boolean }

function Swatch({ name, hex, token, light }: Swatch) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        onClick={copy}
        title={`Copiar ${hex}`}
        style={{
          height: 72,
          background: hex,
          borderRadius: 'var(--radius-lg)',
          border: light ? '1px solid var(--color-neutral-200)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform var(--duration-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {copied && (
          <span style={{ fontSize: 11, fontWeight: 700, color: light ? '#333' : '#fff', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 4 }}>
            Copiado!
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{hex}</div>
        <div style={{ fontSize: 10, color: 'var(--color-neutral-400)', fontFamily: 'monospace', marginTop: 2 }}>{token}</div>
      </div>
    </div>
  )
}

const BRAND: Swatch[] = [
  { name: 'Azul NAWA',      hex: '#204FF1', token: '--color-brand-primary' },
  { name: 'Azul Escuro',    hex: '#0619AD', token: '--color-brand-dark' },
  { name: 'Branco NAWA',    hex: '#D5D5D5', token: '--color-brand-white-nawa' },
  { name: 'Branco',         hex: '#FFFFFF', token: '--color-white', light: true },
]

const BLUE: Swatch[] = [
  { name: 'Blue 50',  hex: '#EEF2FE', token: '--color-blue-50',  light: true },
  { name: 'Blue 100', hex: '#D6DFFE', token: '--color-blue-100', light: true },
  { name: 'Blue 200', hex: '#ADBFFE', token: '--color-blue-200', light: true },
  { name: 'Blue 500', hex: '#204FF1', token: '--color-blue-500' },
  { name: 'Blue 700', hex: '#0619AD', token: '--color-blue-700' },
  { name: 'Blue 900', hex: '#030A52', token: '--color-blue-900' },
]

const NEUTRAL: Swatch[] = [
  { name: 'Neutral 0',   hex: '#FFFFFF', token: '--color-neutral-0',   light: true },
  { name: 'Neutral 50',  hex: '#F8F8F8', token: '--color-neutral-50',  light: true },
  { name: 'Neutral 100', hex: '#F0F0F0', token: '--color-neutral-100', light: true },
  { name: 'Neutral 200', hex: '#E0E0E0', token: '--color-neutral-200', light: true },
  { name: 'Neutral 400', hex: '#A0A0A0', token: '--color-neutral-400', light: true },
  { name: 'Neutral 600', hex: '#606060', token: '--color-neutral-600' },
  { name: 'Neutral 900', hex: '#111111', token: '--color-neutral-900' },
]

const SEMANTIC: Swatch[] = [
  { name: 'Success',       hex: '#22C55E', token: '--color-success' },
  { name: 'Success Light', hex: '#DCFCE7', token: '--color-success-light', light: true },
  { name: 'Warning',       hex: '#F59E0B', token: '--color-warning' },
  { name: 'Warning Light', hex: '#FEF9C3', token: '--color-warning-light', light: true },
  { name: 'Error',         hex: '#EF4444', token: '--color-error' },
  { name: 'Error Light',   hex: '#FEE2E2', token: '--color-error-light',   light: true },
  { name: 'Info',          hex: '#3B82F6', token: '--color-info' },
  { name: 'Info Light',    hex: '#DBEAFE', token: '--color-info-light',    light: true },
]

export default function SectionColors() {
  return (
    <section id="colors" className="ds-section">
      <div className="ds-section-title">01</div>
      <h2 className="ds-section-heading">Cores</h2>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Paleta de marca</div>
        <div className="ds-grid-4">
          {BRAND.map(s => <Swatch key={s.token} {...s} />)}
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Escala de azul</div>
        <div className="ds-grid-4" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
          {BLUE.map(s => <Swatch key={s.token} {...s} />)}
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Neutros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 'var(--space-4)' }}>
          {NEUTRAL.map(s => <Swatch key={s.token} {...s} />)}
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Semânticas</div>
        <div className="ds-grid-4">
          {SEMANTIC.map(s => <Swatch key={s.token} {...s} />)}
        </div>
      </div>
    </section>
  )
}
