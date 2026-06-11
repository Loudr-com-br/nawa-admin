const SHADOWS = [
  { token: '--shadow-sm', label: 'sm', desc: 'Cards em repouso', value: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' },
  { token: '--shadow-md', label: 'md', desc: 'Cards com hover, dropdowns', value: '0 4px 12px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)' },
  { token: '--shadow-lg', label: 'lg', desc: 'Modais, sheets', value: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)' },
  { token: '--shadow-xl', label: 'xl', desc: 'Toasts, overlays', value: '0 24px 56px rgba(0,0,0,0.16), 0 8px 20px rgba(0,0,0,0.10)' },
]

export default function SectionElevation() {
  return (
    <section id="elevation" className="ds-section">
      <div className="ds-section-title">05</div>
      <h2 className="ds-section-heading">Elevação & Sombra</h2>

      <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap', paddingTop: 'var(--space-4)' }}>
        {SHADOWS.map(s => (
          <div key={s.token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div style={{
              width: 160,
              height: 100,
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: s.value,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>shadow-{s.label}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <code style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{s.token}</code>
              <div style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginTop: 2 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liquid Glass */}
      <div style={{ marginTop: 'var(--space-10)' }}>
        <div className="ds-subsection-label">Liquid Glass</div>
        <div style={{ background: 'var(--color-brand-primary)', padding: 'var(--space-8)', borderRadius: 'var(--radius-xl)', display: 'flex', gap: 'var(--space-6)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.20)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            color: '#fff',
            flex: 1,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>GLASS ELEMENT</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>--glass-bg: rgba(255,255,255,0.12)</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            color: '#fff',
            flex: 1,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>GLASS SUBTLE</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Variação mais sutil</div>
          </div>
        </div>
      </div>
    </section>
  )
}
