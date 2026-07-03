'use client'

import { useState } from 'react'

const DURATIONS = [
  { token: '--duration-fast',   value: '150ms', use: 'hover, toggles' },
  { token: '--duration-normal', value: '250ms', use: 'transições de estado' },
  { token: '--duration-slow',   value: '400ms', use: 'modais, page transitions' },
  { token: '--duration-slower', value: '600ms', use: 'animações de entrada' },
]

const EASINGS = [
  { token: '--ease-default', value: 'cubic-bezier(0.4, 0, 0.2, 1)', use: 'padrão' },
  { token: '--ease-in',      value: 'cubic-bezier(0.4, 0, 1, 1)',   use: 'saída de elementos' },
  { token: '--ease-out',     value: 'cubic-bezier(0, 0, 0.2, 1)',   use: 'entrada de elementos' },
]

export default function SectionMotion() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <section id="motion" className="ds-section">
      <div className="ds-section-title">06</div>
      <h2 className="ds-section-heading">Motion</h2>

      <div className="ds-grid-2" style={{ marginBottom: 'var(--space-10)' }}>
        <div>
          <div className="ds-subsection-label">Durações</div>
          {DURATIONS.map(d => (
            <div key={d.token} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
              <div>
                <code style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{d.token}</code>
                <div style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginTop: 2 }}>{d.use}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{d.value}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="ds-subsection-label">Easing</div>
          {EASINGS.map(e => (
            <div key={e.token} style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-neutral-100)', gap: 4 }}>
              <code style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{e.token}</code>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-neutral-400)' }}>{e.value}</span>
              <span style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>{e.use}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ds-subsection-label">Demo interativo — passe o mouse</div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        {DURATIONS.map(d => (
          <div
            key={d.token}
            onMouseEnter={() => setActive(d.token)}
            onMouseLeave={() => setActive(null)}
            style={{
              padding: 'var(--space-4) var(--space-6)',
              background: active === d.token ? 'var(--color-brand-primary)' : 'var(--color-neutral-100)',
              color: active === d.token ? '#fff' : 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'default',
              transition: `all ${d.value} cubic-bezier(0.4,0,0.2,1)`,
              fontWeight: 600,
              fontSize: 13,
              transform: active === d.token ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: active === d.token ? 'var(--shadow-md)' : 'none',
            }}
          >
            {d.value}
          </div>
        ))}
      </div>
    </section>
  )
}