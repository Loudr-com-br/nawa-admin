const CONTRASTS = [
  { fg: '#FFFFFF', bg: '#204FF1', ratio: '5.3:1', pass: true,  label: 'Branco sobre Azul NAWA' },
  { fg: '#FFFFFF', bg: '#0619AD', ratio: '9.1:1', pass: true,  label: 'Branco sobre Azul Escuro' },
  { fg: '#204FF1', bg: '#FFFFFF', ratio: '5.3:1', pass: true,  label: 'Azul NAWA sobre Branco' },
  { fg: '#111111', bg: '#FFFFFF', ratio: '19.6:1', pass: true, label: 'Neutral 900 sobre Branco' },
  { fg: '#606060', bg: '#FFFFFF', ratio: '5.7:1', pass: true,  label: 'Neutral 600 sobre Branco' },
  { fg: '#A0A0A0', bg: '#FFFFFF', ratio: '2.5:1', pass: false, label: 'Neutral 400 — apenas decorativo' },
]

export default function SectionAccessibility() {
  return (
    <section id="a11y" className="ds-section">
      <div className="ds-section-title">14</div>
      <h2 className="ds-section-heading">Acessibilidade</h2>

      {/* Contraste */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Contraste — WCAG AA (mín. 4.5:1 texto normal, 3:1 texto grande)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {CONTRASTS.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: 120, height: 36, background: c.bg, borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: c.bg === '#FFFFFF' ? '1px solid #E0E0E0' : 'none',
              }}>
                <span style={{ color: c.fg, fontSize: 13, fontWeight: 700 }}>Aa</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', minWidth: 60 }}>{c.ratio}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: c.pass ? 'var(--color-success-light)' : 'var(--color-error-light)',
                color: c.pass ? 'var(--color-success)' : 'var(--color-error)',
              }}>
                {c.pass ? 'AA ✓' : 'FALHA'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Focus visible — :focus-visible obrigatório em todos os interativos</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-family)',
            background: 'var(--color-brand-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            outline: '2px solid var(--color-brand-primary)', outlineOffset: 3,
            boxShadow: '0 0 0 4px rgba(32,79,241,0.25)',
          }}>
            Botão com foco
          </button>
          <input
            style={{
              padding: '10px 14px', fontSize: 14, fontFamily: 'var(--font-family)',
              border: '2px solid var(--color-brand-primary)',
              outline: '2px solid var(--color-brand-primary)', outlineOffset: 2,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 0 0 4px rgba(32,79,241,0.15)',
            }}
            defaultValue="Input com foco"
            readOnly
          />
        </div>
        <code style={{ display: 'block', marginTop: 'var(--space-4)', fontSize: 12, color: 'var(--text-secondary)', background: 'var(--color-neutral-100)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontFamily: 'monospace' }}>
          {`:focus-visible { outline: 2px solid var(--color-brand-primary); outline-offset: 2px; }`}
        </code>
      </div>

      {/* Touch target */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Touch target mínimo — 44×44px (iOS HIG + Material)</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(32,79,241,0.1)', border: '1.5px dashed var(--color-brand-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 24, height: 24, background: 'var(--color-brand-primary)', borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Área de toque: <strong>44×44px</strong> mínimo<br />
            <code style={{ fontSize: 11, fontFamily: 'monospace' }}>--touch-target-min: 44px</code>
          </div>
        </div>
      </div>

      {/* Princípios */}
      <div style={{ background: 'var(--color-blue-50)', border: '1px solid var(--color-blue-200)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-primary)', marginBottom: 'var(--space-3)' }}>Princípios de Design — NAWA</div>
        <ol style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[
            'A barra é o portal — o espaço entre NA e WA é onde a marca coloca o mundo.',
            'Azul como energia, não frieza — elétrico, vibrante, de movimento.',
            'Tipografia como imagem — AT Aero Black em tamanho máximo é peça gráfica.',
            'Premium pelo silêncio — menos elementos, mais espaço. Sem degradês, sem ruído.',
            'Continuidade como princípio estético — um sistema que se expande e evolui.',
            'Sólidos, não gradientes — todo o look and feel construído sobre elementos sólidos.',
          ].map((p, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{p}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}
