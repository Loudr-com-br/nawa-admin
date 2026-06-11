import azul01 from '../assets/logo/nawa_logo_azul01.png'
import azul02 from '../assets/logo/nawa_logo_azul02.png'
import branco01 from '../assets/logo/nawa_logo_branco01.png'
import branco02 from '../assets/logo/nawa_logo_branco02.png'
import preto01 from '../assets/logo/nawa_logo_preto01.png'
import preto02 from '../assets/logo/nawa_logo_preto02.png'

const PILLARS = [
  { name: 'Recuperação', symbol: '+',  desc: '+ estilizado' },
  { name: 'Força',       symbol: '⋀⋀', desc: 'duplo chevron' },
  { name: 'Energia',     symbol: '↺',  desc: 'seta circular' },
  { name: 'Foco',        symbol: '□',  desc: 'quadrado com detalhe' },
  { name: 'Longevidade', symbol: '∞',  desc: 'infinito' },
]

const SIGNATURES = [
  { label: 'Principal',          bg: '#204FF1', border: false, img01: branco01, img02: branco02 },
  { label: 'Dark',               bg: '#0619AD', border: false, img01: branco01, img02: branco02 },
  { label: 'Claro sobre branco', bg: '#FFFFFF', border: true,  img01: azul01,   img02: azul02   },
  { label: 'Claro sobre neutro', bg: '#F0F0F0', border: false, img01: azul01,   img02: azul02   },
  { label: 'Preto sobre branco', bg: '#FFFFFF', border: true,  img01: preto01,  img02: preto02  },
]

export default function SectionBrandAssets() {
  return (
    <section id="brand-assets" className="ds-section">
      <div className="ds-section-title">13</div>
      <h2 className="ds-section-heading">Brand Assets</h2>

      {/* Assinaturas com logos reais */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Assinaturas validadas — versões 01 e 02</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {SIGNATURES.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', letterSpacing: '0.06em' }}>
                {s.label.toUpperCase()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                {/* Versão 01 */}
                <div>
                  <div style={{
                    background: s.bg,
                    border: s.border ? '1px solid #E0E0E0' : 'none',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                  }}>
                    <img src={s.img01} alt={`NAWA ${s.label} 01`} style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-neutral-400)', marginTop: 6, fontFamily: 'monospace' }}>versão 01</div>
                </div>
                {/* Versão 02 */}
                <div>
                  <div style={{
                    background: s.bg,
                    border: s.border ? '1px solid #E0E0E0' : 'none',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                  }}>
                    <img src={s.img02} alt={`NAWA ${s.label} 02`} style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-neutral-400)', marginTop: 6, fontFamily: 'monospace' }}>versão 02</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assinatura cambiante */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Assinatura cambiante — barra como portal</div>
        <div style={{ background: 'var(--color-brand-primary)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Compacto */}
          <div style={{ fontFamily: 'var(--font-family)', fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center' }}>
            NA<span style={{ display: 'inline-block', width: 40, height: 6, background: '#fff', margin: '0 8px', borderRadius: 3 }} />WA
          </div>
          {/* Expandido */}
          <div style={{ fontFamily: 'var(--font-family)', fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center' }}>
            NA<span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 200, height: 6, background: '#fff', margin: '0 8px', borderRadius: 3,
            }} />WA
          </div>
          {/* Com conteúdo na barra */}
          <div style={{ fontFamily: 'var(--font-family)', fontSize: 52, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center' }}>
            NA
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 220, height: 52, background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              margin: '0 8px', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: 600, letterSpacing: '0.06em',
            }}>
              Saúde contínua.
            </span>
            WA
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            A barra entre NA e WA é o portal — pode ser cor sólida, tagline, foto ou vazio expandido.
          </p>
        </div>
      </div>

      {/* Ícones de pilar */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Ícones dos 5 pilares</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {PILLARS.map(p => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: 72, height: 72,
                background: 'var(--color-brand-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: '#fff', fontWeight: 700,
              }}>
                {p.symbol}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset diagonal */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Asset Diagonal</div>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ width: 200, height: 120, background: 'var(--color-brand-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 100, height: 200,
              background: 'var(--color-brand-dark)',
              transformOrigin: 'top right',
              transform: 'skewX(-20deg)',
            }} />
          </div>
          <div style={{ width: 200, height: 120, background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', border: '1px solid var(--color-neutral-200)' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 100, height: 200,
              background: 'var(--color-brand-primary)',
              transformOrigin: 'top left',
              transform: 'skewX(-20deg)',
            }} />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Cortes no mesmo ângulo do espaço entre as letras "AW" do logotipo.
        </p>
      </div>
    </section>
  )
}
