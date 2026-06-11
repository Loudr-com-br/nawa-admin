const RADII = [
  { token: '--radius-sm',   value: '4px',    label: 'sm',   desc: 'Tags, badges, chips' },
  { token: '--radius-md',   value: '8px',    label: 'md',   desc: 'Inputs, botões pequenos' },
  { token: '--radius-lg',   value: '12px',   label: 'lg',   desc: 'Cards, modais' },
  { token: '--radius-xl',   value: '16px',   label: 'xl',   desc: 'Cards de destaque, bottom sheets' },
  { token: '--radius-2xl',  value: '24px',   label: '2xl',  desc: 'Cards hero, drawers' },
  { token: '--radius-full', value: '9999px', label: 'full', desc: 'Avatares, pills' },
]

export default function SectionBorderRadius() {
  return (
    <section id="radius" className="ds-section">
      <div className="ds-section-title">04</div>
      <h2 className="ds-section-heading">Raio de borda</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
        Arestas arredondadas contrastam com as linhas retas do logotipo.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {RADII.map(r => (
          <div key={r.token} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'var(--color-brand-primary)',
              borderRadius: r.value,
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.label}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-neutral-400)', marginTop: 2, maxWidth: 80 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
