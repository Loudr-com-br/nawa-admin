type TypeRow = {
  label: string
  size: string
  weight: string
  token: string
  sample: string
  style?: React.CSSProperties
}

const SCALE: TypeRow[] = [
  { label: 'Display XL',  size: '80px', weight: '900', token: '--text-display-xl', sample: 'NAWA Health',        style: { fontSize: 80, fontWeight: 900, lineHeight: 1 } },
  { label: 'Display LG',  size: '56px', weight: '900', token: '--text-display-lg', sample: 'NAWA Health',        style: { fontSize: 56, fontWeight: 900, lineHeight: 1.05 } },
  { label: 'Display MD',  size: '40px', weight: '700', token: '--text-display-md', sample: 'NAWA Health',        style: { fontSize: 40, fontWeight: 700, lineHeight: 1.1 } },
  { label: 'Heading 1',   size: '32px', weight: '700', token: '--text-h1',         sample: 'Saúde contínua.',    style: { fontSize: 32, fontWeight: 700 } },
  { label: 'Heading 2',   size: '24px', weight: '700', token: '--text-h2',         sample: 'Seu protocolo ativo', style: { fontSize: 24, fontWeight: 700 } },
  { label: 'Heading 3',   size: '20px', weight: '600', token: '--text-h3',         sample: 'Recuperação e força', style: { fontSize: 20, fontWeight: 600 } },
  { label: 'Heading 4',   size: '16px', weight: '600', token: '--text-h4',         sample: 'Detalhes do plano',   style: { fontSize: 16, fontWeight: 600 } },
  { label: 'Body LG',     size: '18px', weight: '400', token: '--text-body-lg',    sample: 'Sua plataforma personalizada de saúde contínua. Com médicos reais que te acompanham.', style: { fontSize: 18, fontWeight: 400 } },
  { label: 'Body MD',     size: '16px', weight: '400', token: '--text-body-md',    sample: 'Sua plataforma personalizada de saúde contínua. Com médicos reais que te acompanham.', style: { fontSize: 16, fontWeight: 400 } },
  { label: 'Body SM',     size: '14px', weight: '400', token: '--text-body-sm',    sample: 'Sua plataforma personalizada de saúde contínua. Com médicos reais.', style: { fontSize: 14, fontWeight: 400 } },
  { label: 'Label LG',    size: '14px', weight: '600', token: '--text-label-lg',   sample: 'INICIAR PROTOCOLO',  style: { fontSize: 14, fontWeight: 600, letterSpacing: '0.08em' } },
  { label: 'Label MD',    size: '12px', weight: '600', token: '--text-label-md',   sample: 'VER DETALHES',       style: { fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' } },
  { label: 'Label SM',    size: '11px', weight: '600', token: '--text-label-sm',   sample: 'ATIVO',              style: { fontSize: 11, fontWeight: 600, letterSpacing: '0.1em' } },
  { label: 'Caption',     size: '12px', weight: '400', token: '--text-caption',    sample: 'Última atualização: hoje às 14h32', style: { fontSize: 12, fontWeight: 400 } },
]

export default function SectionTypography() {
  return (
    <section id="typography" className="ds-section">
      <div className="ds-section-title">02</div>
      <h2 className="ds-section-heading">Tipografia</h2>

      <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-blue-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-blue-200)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand-primary)' }}>Fonte principal: AT Aero (Arilla Type Studio) — </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fallback: Poppins. Carregar AT Aero via licença em arillatype.studio.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {SCALE.map(row => (
          <div key={row.token} style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 'var(--space-6)',
            alignItems: 'center',
            padding: 'var(--space-5) 0',
            borderBottom: '1px solid var(--color-neutral-100)',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{row.size} · {row.weight}</div>
              <code style={{ fontSize: 10, color: 'var(--color-neutral-400)', background: 'var(--color-neutral-100)', padding: '1px 5px', borderRadius: 3, marginTop: 4, display: 'inline-block' }}>{row.token}</code>
            </div>
            <div style={{ ...row.style, fontFamily: 'var(--font-family)', color: 'var(--text-primary)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {row.sample}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
