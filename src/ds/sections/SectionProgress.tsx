'use client'

import { useState } from 'react'

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--color-neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: value === 100 ? 'var(--color-success)' : 'var(--color-brand-primary)',
          borderRadius: 'var(--radius-full)',
          transition: 'width var(--duration-slow) var(--ease-out)',
        }} />
      </div>
    </div>
  )
}

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {Array.from({ length: total }).map((_, i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'active' : 'pending'
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: state === 'pending' ? 'var(--color-neutral-200)' : state === 'active' ? 'var(--color-brand-primary)' : 'var(--color-success)',
              color: state === 'pending' ? 'var(--text-secondary)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              border: state === 'active' ? '2px solid var(--color-brand-primary)' : 'none',
              boxShadow: state === 'active' ? '0 0 0 3px rgba(32,79,241,0.2)' : 'none',
              transition: 'all var(--duration-normal)',
            }}>
              {state === 'done' ? '✓' : i + 1}
            </div>
            {i < total - 1 && (
              <div style={{
                height: 2, width: 48,
                background: i + 1 < current ? 'var(--color-success)' : 'var(--color-neutral-200)',
                transition: 'background var(--duration-normal)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SectionProgress() {
  const [step, setStep] = useState(2)

  return (
    <section id="progress" className="ds-section">
      <div className="ds-section-title">09</div>
      <h2 className="ds-section-heading">Progress & Steps</h2>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Barra de progresso linear</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: 480 }}>
          <ProgressBar value={33} label="Anamnese — Etapa 1 de 3" />
          <ProgressBar value={66} label="Anamnese — Etapa 2 de 3" />
          <ProgressBar value={100} label="Concluído" />
        </div>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Step indicator interativo</div>
        <StepIndicator total={5} current={step} />
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'var(--color-neutral-100)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            ← Anterior
          </button>
          <button
            onClick={() => setStep(s => Math.min(5, s + 1))}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, background: 'var(--color-brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            Próximo →
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          Etapa {step} de 5
        </p>
      </div>

      <div className="ds-subsection">
        <div className="ds-subsection-label">Radio & Checkbox</div>
        <div className="ds-grid-2" style={{ gap: 'var(--space-6)' }}>
          {/* Radio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Radio</span>
            {['Recuperação', 'Força', 'Energia'].map((opt, i) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="pillar" defaultChecked={i === 0}
                  style={{ accentColor: 'var(--color-brand-primary)', width: 18, height: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{opt}</span>
              </label>
            ))}
          </div>
          {/* Checkbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checkbox</span>
            {['Vitaminas', 'Minerais', 'Adaptógenos'].map((opt, i) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked={i < 2}
                  style={{ accentColor: 'var(--color-brand-primary)', width: 18, height: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}