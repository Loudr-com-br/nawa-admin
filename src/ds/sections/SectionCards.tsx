'use client'

import { useState } from 'react'

const cardBase: React.CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  background: 'var(--surface-card)',
}

export default function SectionCards() {
  const [selected, setSelected] = useState<number | null>(1)

  const plans = [
    { id: 0, name: 'Starter',     price: 'R$ 149/mês', desc: 'Protocolo básico personalizado.' },
    { id: 1, name: 'Essencial',   price: 'R$ 249/mês', desc: 'Protocolo completo + acompanhamento.', recommended: true },
    { id: 2, name: 'Premium',     price: 'R$ 399/mês', desc: 'Protocolo avançado + consultas ilimitadas.' },
  ]

  return (
    <section id="cards" className="ds-section">
      <div className="ds-section-title">10</div>
      <h2 className="ds-section-heading">Cards</h2>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Variantes base</div>
        <div className="ds-grid-3">
          {/* Default */}
          <div style={{ ...cardBase, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-neutral-200)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Default</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Protocolo Ativo</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>shadow-sm · border padrão</div>
          </div>

          {/* Interactive (hover) */}
          <div
            style={{ ...cardBase, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-neutral-200)', cursor: 'pointer', transition: 'all var(--duration-fast)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Interactive</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Ver Exames</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Hover: lift + shadow-md</div>
          </div>

          {/* Highlighted */}
          <div style={{ ...cardBase, background: 'var(--color-brand-primary)', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.7, textTransform: 'uppercase', marginBottom: 8 }}>Highlighted</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Plano Recomendado</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>bg brand-primary · texto branco</div>
          </div>
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Seleção de plano — cards interativos</div>
        <div className="ds-grid-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              style={{
                ...cardBase,
                border: selected === plan.id
                  ? '2px solid var(--color-brand-primary)'
                  : '2px solid var(--color-neutral-200)',
                boxShadow: selected === plan.id ? '0 0 0 3px rgba(32,79,241,0.15)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all var(--duration-fast)',
                position: 'relative',
              }}
            >
              {plan.recommended && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--color-brand-primary)', color: '#fff',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                }}>
                  RECOMENDADO
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected === plan.id ? 'var(--color-brand-primary)' : 'var(--color-neutral-400)'}`,
                  background: selected === plan.id ? 'var(--color-brand-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--duration-fast)',
                }}>
                  {selected === plan.id && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: selected === plan.id ? 'var(--color-brand-primary)' : 'var(--text-primary)', marginBottom: 6 }}>{plan.price}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{plan.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}