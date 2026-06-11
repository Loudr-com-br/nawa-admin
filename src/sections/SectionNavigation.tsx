import azul01 from '../assets/logo/nawa_logo_azul01.png'
import branco01 from '../assets/logo/nawa_logo_branco01.png'

const NAV_ITEMS = ['HOME', 'START HERE', 'TREATMENTS', 'CONTACT']

const BOTTOM_ITEMS = [
  { icon: '⌂', label: 'Home' },
  { icon: '◎', label: 'Protocolo' },
  { icon: '📦', label: 'Pedidos' },
  { icon: '◯', label: 'Perfil' },
]

export default function SectionNavigation() {
  return (
    <section id="navigation" className="ds-section">
      <div className="ds-section-title">11</div>
      <h2 className="ds-section-heading">Navegação</h2>

      {/* Top Nav — Solid */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Top Nav — Solid</div>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-200)',
          padding: '0 var(--space-6)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <img src={azul01} alt="NAWA" style={{ height: 28, display: 'block' }} />
          <nav style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {NAV_ITEMS.map(item => (
              <a key={item} href="#navigation" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: item === 'HOME' ? 'var(--color-brand-primary)' : 'var(--text-secondary)', textDecoration: 'none', transition: 'color var(--duration-fast)' }}>
                {item}
              </a>
            ))}
          </nav>
          <button style={{ background: 'var(--color-brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
            START HERE
          </button>
        </div>
      </div>

      {/* Top Nav — Brand */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Top Nav — Brand (fundo Azul NAWA)</div>
        <div style={{
          background: 'var(--color-brand-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '0 var(--space-6)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <img src={branco01} alt="NAWA" style={{ height: 28, display: 'block' }} />
          <nav style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {NAV_ITEMS.map(item => (
              <a key={item} href="#navigation" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: item === 'HOME' ? '#fff' : 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
                {item}
              </a>
            ))}
          </nav>
          <button style={{ background: '#fff', color: 'var(--color-brand-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
            START HERE
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="ds-subsection">
        <div className="ds-subsection-label">Bottom Navigation (mobile)</div>
        <div style={{ maxWidth: 375, margin: '0 auto' }}>
          <div style={{
            background: '#fff',
            borderTop: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 0 8px',
            display: 'flex',
            justifyContent: 'space-around',
          }}>
            {BOTTOM_ITEMS.map((item, i) => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64, minHeight: 44, justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 22, color: i === 0 ? 'var(--color-brand-primary)' : 'var(--color-neutral-400)' }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--color-brand-primary)' : 'var(--color-neutral-400)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
