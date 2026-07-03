const TOASTS = [
  { type: 'success', color: 'var(--color-success)',       bg: 'var(--color-success-light)',   icon: '✓', title: 'Pedido confirmado',        msg: 'Seu protocolo foi enviado para produção.' },
  { type: 'error',   color: 'var(--color-error)',         bg: 'var(--color-error-light)',     icon: '✕', title: 'Pagamento recusado',       msg: 'Verifique os dados do cartão e tente novamente.' },
  { type: 'warning', color: 'var(--color-warning)',       bg: 'var(--color-warning-light)',   icon: '!', title: 'Prazo se aproximando',     msg: 'Sua assinatura vence em 3 dias.' },
  { type: 'info',    color: 'var(--color-info)',          bg: 'var(--color-info-light)',      icon: 'i', title: 'Nova funcionalidade',      msg: 'Acompanhe sua evolução na aba Protocolo.' },
]

export default function SectionToasts() {
  return (
    <section id="toasts" className="ds-section">
      <div className="ds-section-title">12</div>
      <h2 className="ds-section-heading">Toasts & Notificações</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 480 }}>
        {TOASTS.map(t => (
          <div key={t.type} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: t.bg,
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${t.color}30`,
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: t.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, flexShrink: 0,
            }}>
              {t.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.msg}</div>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)', padding: 2 }}>×</button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>
        Auto-dismiss padrão: 4s · Posição: top-center (mobile) · bottom-right (desktop)
      </p>
    </section>
  )
}
