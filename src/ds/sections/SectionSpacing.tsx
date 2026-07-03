const SPACES = [
  { token: '--space-1',  px: 4  },
  { token: '--space-2',  px: 8  },
  { token: '--space-3',  px: 12 },
  { token: '--space-4',  px: 16 },
  { token: '--space-5',  px: 20 },
  { token: '--space-6',  px: 24 },
  { token: '--space-8',  px: 32 },
  { token: '--space-10', px: 40 },
  { token: '--space-12', px: 48 },
  { token: '--space-16', px: 64 },
  { token: '--space-20', px: 80 },
  { token: '--space-24', px: 96 },
]

export default function SectionSpacing() {
  return (
    <section id="spacing" className="ds-section">
      <div className="ds-section-title">03</div>
      <h2 className="ds-section-heading">Espaçamento</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        Grid baseado em múltiplos de 4pt.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {SPACES.map(s => (
          <div key={s.token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <code style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: 110 }}>{s.token}</code>
            <span style={{ fontSize: 12, color: 'var(--color-neutral-400)', minWidth: 36 }}>{s.px}px</span>
            <div style={{
              height: 20,
              width: s.px,
              background: 'var(--color-brand-primary)',
              borderRadius: 3,
              flexShrink: 0,
            }} />
          </div>
        ))}
      </div>
    </section>
  )
}
