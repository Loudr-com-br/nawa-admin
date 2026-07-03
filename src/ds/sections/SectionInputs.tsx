'use client'

import { useState } from 'react'

const inputBase: React.CSSProperties = {
  width: '100%', fontFamily: 'var(--font-family)', fontSize: 16,
  padding: '0 14px', height: 48, borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--border-default)', background: '#fff',
  color: 'var(--text-primary)', outline: 'none',
  transition: 'border-color var(--duration-fast)',
}

function Field({ label, helper, error, disabled, type = 'text', placeholder = '' }: {
  label: string; helper?: string; error?: string; disabled?: boolean; type?: string; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: error ? 'var(--color-error)' : 'var(--text-primary)' }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          borderColor: error ? 'var(--color-error)' : focused ? 'var(--color-brand-primary)' : 'var(--border-default)',
          boxShadow: focused && !error ? '0 0 0 3px rgba(32,79,241,0.12)' : error && focused ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {(helper || error) && (
        <span style={{ fontSize: 12, color: error ? 'var(--color-error)' : 'var(--text-secondary)' }}>
          {error || helper}
        </span>
      )}
    </div>
  )
}

function FloatingField({ label }: { label: string }) {
  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')
  const lifted = focused || value.length > 0
  return (
    <div style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          paddingTop: 16,
          borderColor: focused ? 'var(--color-brand-primary)' : 'var(--border-default)',
          boxShadow: focused ? '0 0 0 3px rgba(32,79,241,0.12)' : 'none',
        }}
      />
      <label style={{
        position: 'absolute', left: 14,
        top: lifted ? 8 : '50%',
        transform: lifted ? 'none' : 'translateY(-50%)',
        fontSize: lifted ? 10 : 16,
        fontWeight: lifted ? 600 : 400,
        color: focused ? 'var(--color-brand-primary)' : 'var(--text-secondary)',
        pointerEvents: 'none',
        transition: 'all var(--duration-fast)',
      }}>
        {label}
      </label>
    </div>
  )
}

export default function SectionInputs() {
  return (
    <section id="inputs" className="ds-section">
      <div className="ds-section-title">08</div>
      <h2 className="ds-section-heading">Inputs</h2>

      <div className="ds-grid-2" style={{ gap: 'var(--space-6)' }}>
        <div className="ds-subsection">
          <div className="ds-subsection-label">Estados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Field label="Email" type="email" placeholder="voce@exemplo.com" helper="Digite seu email de acesso." />
            <Field label="Nome completo" placeholder="João Silva" />
            <Field label="Telefone (Erro)" type="tel" placeholder="(11) 99999-9999" error="Número inválido. Verifique o DDD." />
            <Field label="Campo desabilitado" placeholder="Não editável" disabled />
          </div>
        </div>

        <div className="ds-subsection">
          <div className="ds-subsection-label">Outros tipos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Select</label>
              <select style={{ ...inputBase }}>
                <option>Selecione seu objetivo</option>
                <option>Recuperação</option>
                <option>Força</option>
                <option>Energia</option>
                <option>Foco</option>
                <option>Longevidade</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Textarea</label>
              <textarea
                placeholder="Descreva seus sintomas ou objetivos..."
                rows={4}
                style={{ ...inputBase, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="ds-subsection" style={{ marginTop: 'var(--space-8)' }}>
        <div className="ds-subsection-label">Floating label</div>
        <div style={{ maxWidth: 360 }}>
          <FloatingField label="Seu nome completo" />
        </div>
      </div>
    </section>
  )
}