import Link from 'next/link'
import './design-system.css'
import SectionColors from './sections/SectionColors'
import SectionTypography from './sections/SectionTypography'
import SectionSpacing from './sections/SectionSpacing'
import SectionBorderRadius from './sections/SectionBorderRadius'
import SectionElevation from './sections/SectionElevation'
import SectionMotion from './sections/SectionMotion'
import SectionButtons from './sections/SectionButtons'
import SectionInputs from './sections/SectionInputs'
import SectionProgress from './sections/SectionProgress'
import SectionCards from './sections/SectionCards'
import SectionNavigation from './sections/SectionNavigation'
import SectionToasts from './sections/SectionToasts'
import SectionBrandAssets from './sections/SectionBrandAssets'
import SectionAccessibility from './sections/SectionAccessibility'
import SectionTokens from './sections/SectionTokens'

const logoBranco01 = '/logo/nawa_logo_branco01.png'
const logoBranco02 = '/logo/nawa_logo_branco02.png'

const NAV = [
  { id: 'colors',       label: 'Cores' },
  { id: 'typography',   label: 'Tipografia' },
  { id: 'spacing',      label: 'Espaçamento' },
  { id: 'radius',       label: 'Bordas' },
  { id: 'elevation',    label: 'Elevação' },
  { id: 'motion',       label: 'Motion' },
  { id: 'buttons',      label: 'Botões' },
  { id: 'inputs',       label: 'Inputs' },
  { id: 'progress',     label: 'Progress' },
  { id: 'cards',        label: 'Cards' },
  { id: 'navigation',   label: 'Navegação' },
  { id: 'toasts',       label: 'Toasts' },
  { id: 'brand-assets', label: 'Brand Assets' },
  { id: 'a11y',         label: 'Acessibilidade' },
  { id: 'tokens',       label: 'Export Tokens' },
]

export default function DesignSystem() {
  return (
    <div className="ds-root">
      <aside className="ds-sidebar">
        <div className="ds-sidebar-brand">
          <Link href="/" style={{ textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBranco01} alt="NAWA" style={{ height: 28, display: 'block' }} />
          </Link>
          <span className="ds-logo-tag">Design System</span>
        </div>
        <nav className="ds-nav">
          {NAV.map(item => (
            <a key={item.id} href={`#${item.id}`} className="ds-nav-link">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ds-sidebar-footer">
          <span>NAWA Health · 2026</span>
        </div>
      </aside>

      <main className="ds-main">
        <header className="ds-header">
          <img src={logoBranco02} alt="NAWA" className="ds-header-logo-img" />
          <p className="ds-header-tag">Saúde contínua.</p>
          <p className="ds-header-desc">
            Sistema de design oficial · Produto digital · 2026
          </p>
        </header>

        <SectionColors />
        <SectionTypography />
        <SectionSpacing />
        <SectionBorderRadius />
        <SectionElevation />
        <SectionMotion />
        <SectionButtons />
        <SectionInputs />
        <SectionProgress />
        <SectionCards />
        <SectionNavigation />
        <SectionToasts />
        <SectionBrandAssets />
        <SectionAccessibility />
        <SectionTokens />
      </main>
    </div>
  )
}
