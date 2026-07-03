'use client'

import { useState } from 'react'

const TOKENS = {
  color: {
    brand: {
      primary:    { $value: '#204FF1', $type: 'color' },
      dark:       { $value: '#0619AD', $type: 'color' },
      whiteNawa:  { $value: '#D5D5D5', $type: 'color' },
    },
    blue: {
      50:  { $value: '#EEF2FE', $type: 'color' },
      100: { $value: '#D6DFFE', $type: 'color' },
      200: { $value: '#ADBFFE', $type: 'color' },
      500: { $value: '#204FF1', $type: 'color' },
      700: { $value: '#0619AD', $type: 'color' },
      900: { $value: '#030A52', $type: 'color' },
    },
    neutral: {
      0:   { $value: '#FFFFFF', $type: 'color' },
      50:  { $value: '#F8F8F8', $type: 'color' },
      100: { $value: '#F0F0F0', $type: 'color' },
      200: { $value: '#E0E0E0', $type: 'color' },
      400: { $value: '#A0A0A0', $type: 'color' },
      600: { $value: '#606060', $type: 'color' },
      900: { $value: '#111111', $type: 'color' },
    },
    semantic: {
      success:      { $value: '#22C55E', $type: 'color' },
      successLight: { $value: '#DCFCE7', $type: 'color' },
      warning:      { $value: '#F59E0B', $type: 'color' },
      warningLight: { $value: '#FEF9C3', $type: 'color' },
      error:        { $value: '#EF4444', $type: 'color' },
      errorLight:   { $value: '#FEE2E2', $type: 'color' },
      info:         { $value: '#3B82F6', $type: 'color' },
      infoLight:    { $value: '#DBEAFE', $type: 'color' },
    },
  },
  spacing: {
    1:  { $value: '4px',  $type: 'dimension' },
    2:  { $value: '8px',  $type: 'dimension' },
    3:  { $value: '12px', $type: 'dimension' },
    4:  { $value: '16px', $type: 'dimension' },
    5:  { $value: '20px', $type: 'dimension' },
    6:  { $value: '24px', $type: 'dimension' },
    8:  { $value: '32px', $type: 'dimension' },
    10: { $value: '40px', $type: 'dimension' },
    12: { $value: '48px', $type: 'dimension' },
    16: { $value: '64px', $type: 'dimension' },
    20: { $value: '80px', $type: 'dimension' },
    24: { $value: '96px', $type: 'dimension' },
  },
  borderRadius: {
    sm:   { $value: '4px',    $type: 'dimension' },
    md:   { $value: '8px',    $type: 'dimension' },
    lg:   { $value: '12px',   $type: 'dimension' },
    xl:   { $value: '16px',   $type: 'dimension' },
    '2xl':{ $value: '24px',   $type: 'dimension' },
    full: { $value: '9999px', $type: 'dimension' },
  },
  typography: {
    fontFamily: { $value: 'AT Aero, sans-serif', $type: 'fontFamily' },
    fontWeight: {
      regular:   { $value: '400', $type: 'fontWeight' },
      semibold:  { $value: '600', $type: 'fontWeight' },
      bold:      { $value: '700', $type: 'fontWeight' },
      black:     { $value: '900', $type: 'fontWeight' },
    },
  },
  motion: {
    duration: {
      fast:   { $value: '150ms', $type: 'duration' },
      normal: { $value: '250ms', $type: 'duration' },
      slow:   { $value: '400ms', $type: 'duration' },
      slower: { $value: '600ms', $type: 'duration' },
    },
  },
}

const GROUPS = [
  { key: 'color',        label: 'Cores',        description: 'Marca, escala azul, neutros e semânticas' },
  { key: 'spacing',      label: 'Espaçamento',  description: 'Grid de 4pt' },
  { key: 'borderRadius', label: 'Raio de borda', description: '6 níveis' },
  { key: 'typography',   label: 'Tipografia',   description: 'Família e pesos' },
  { key: 'motion',       label: 'Motion',       description: 'Durações' },
]

export default function SectionTokens() {
  const [active, setActive] = useState<string>('color')
  const [copied, setCopied] = useState<'group' | 'all' | null>(null)

  const groupJson = JSON.stringify({ [active]: TOKENS[active as keyof typeof TOKENS] }, null, 2)
  const fullJson  = JSON.stringify(TOKENS, null, 2)

  function copy(type: 'group' | 'all') {
    navigator.clipboard.writeText(type === 'group' ? groupJson : fullJson)
    setCopied(type)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <section id="tokens" className="ds-section">
      <div className="ds-section-title">15</div>
      <h2 className="ds-section-heading">Export Tokens</h2>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', maxWidth: 560 }}>
        JSON no formato <strong>Token Studio</strong> (W3C Design Tokens). Importe no Figma via plugin
        {' '}<a href="https://tokens.studio" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>Tokens Studio for Figma</a>.
      </p>

      {/* Tabs de grupo */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        {GROUPS.map(g => (
          <button
            key={g.key}
            onClick={() => setActive(g.key)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-family)',
              borderRadius: 'var(--radius-full)',
              border: active === g.key ? 'none' : '1.5px solid var(--color-neutral-200)',
              background: active === g.key ? 'var(--color-brand-primary)' : 'transparent',
              color: active === g.key ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--duration-fast)',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Descrição do grupo ativo */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
        {GROUPS.find(g => g.key === active)?.description}
      </div>

      {/* Code block */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-neutral-200)' }}>
        {/* Header do bloco */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px var(--space-4)',
          background: 'var(--color-neutral-900)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            nawa-tokens.json
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => copy('group')}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 700,
                fontFamily: 'var(--font-family)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: copied === 'group' ? 'var(--color-success)' : 'rgba(255,255,255,0.08)',
                color: '#fff', cursor: 'pointer',
                transition: 'all var(--duration-fast)',
              }}
            >
              {copied === 'group' ? '✓ Copiado' : 'Copiar grupo'}
            </button>
            <button
              onClick={() => copy('all')}
              style={{
                padding: '4px 12px', fontSize: 11, fontWeight: 700,
                fontFamily: 'var(--font-family)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: copied === 'all' ? 'var(--color-success)' : 'var(--color-brand-primary)',
                color: '#fff', cursor: 'pointer',
                transition: 'all var(--duration-fast)',
              }}
            >
              {copied === 'all' ? '✓ Copiado' : 'Copiar tudo'}
            </button>
          </div>
        </div>

        {/* JSON */}
        <pre style={{
          margin: 0,
          padding: 'var(--space-6)',
          background: '#1a1a2e',
          color: '#e2e8f0',
          fontSize: 12,
          lineHeight: 1.7,
          fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
          overflowX: 'auto',
          maxHeight: 480,
          overflowY: 'auto',
        }}>
          <TokenJson json={groupJson} />
        </pre>
      </div>

      {/* Instrução de uso */}
      <div style={{
        marginTop: 'var(--space-6)',
        padding: 'var(--space-5)',
        background: 'var(--color-blue-50)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-blue-200)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-brand-primary)', marginBottom: 'var(--space-2)' }}>
          Como importar no Figma
        </div>
        <ol style={{ paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {[
            'Instale o plugin "Tokens Studio for Figma" na sua conta',
            'Crie um novo token set e cole o JSON copiado',
            'Aplique os tokens como Figma Variables (cor, espaçamento, raio)',
            'Sincronize com o repositório via GitHub para manter em sincronia',
          ].map((step, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{step}</li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function TokenJson({ json }: { json: string }) {
  const lines = json.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const key   = line.match(/^(\s*)"([^"]+)"(\s*:)/)
        const str   = line.match(/"([^"]*)"(?!\s*:)/)
        const color = line.match(/#[0-9A-Fa-f]{3,8}/)

        if (color) {
          const [before, ...rest] = line.split(color[0])
          return (
            <span key={i} style={{ display: 'block' }}>
              <span style={{ color: '#94a3b8' }}>{before}</span>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: color[0], borderRadius: 2, verticalAlign: 'middle', marginRight: 4, border: '1px solid rgba(255,255,255,0.15)' }} />
              <span style={{ color: '#fbbf24' }}>{color[0]}</span>
              <span style={{ color: '#94a3b8' }}>{rest.join(color[0])}</span>
            </span>
          )
        }
        if (key) {
          return (
            <span key={i} style={{ display: 'block' }}>
              <span style={{ color: '#94a3b8' }}>{line.slice(0, key.index! + key[1].length)}</span>
              <span style={{ color: '#7dd3fc' }}>&quot;{key[2]}&quot;</span>
              <span style={{ color: '#94a3b8' }}>{key[3]}{line.slice(key.index! + key[0].length)}</span>
            </span>
          )
        }
        if (str) {
          return (
            <span key={i} style={{ display: 'block' }}>
              <span style={{ color: '#94a3b8' }}>{line.slice(0, str.index)}</span>
              <span style={{ color: '#86efac' }}>&quot;{str[1]}&quot;</span>
              <span style={{ color: '#94a3b8' }}>{line.slice(str.index! + str[0].length)}</span>
            </span>
          )
        }
        return <span key={i} style={{ display: 'block', color: '#94a3b8' }}>{line}</span>
      })}
    </>
  )
}