import type { Metadata } from 'next'
import './globals.css'
import HotReload from './components/HotReload'
import PageReady from './components/PageReady'

export const metadata: Metadata = {
  title: 'Resume',
  icons: { icon: '/assets/clawdcv.png' },
}

// Critical pre-paint CSS, inlined so it lands in the very first HTML the browser parses —
// before the JS-injected app/module CSS (which in dev arrives a beat late, causing the
// "raw resume text on a white page" flash on reload). Two jobs:
//   1. Paint the charcoal app background immediately, so a reload never flashes white.
//   2. Hide the resume itself ([data-zoom-wrap]) until the client marks the doc ready; by
//      then the real styles have loaded, so it fades in already-styled instead of raw.
// The export button + dev toggle live OUTSIDE [data-zoom-wrap], so they stay visible while
// loading. @media print forces the resume visible regardless, so PDF export is never gated.
const CRITICAL_CSS = `
  html, body { background: #111827; margin: 0; }
  html:not(.cv-ready) [data-zoom-wrap] { opacity: 0; }
  [data-zoom-wrap] { transition: opacity 160ms ease; }
  @media print { [data-zoom-wrap] { opacity: 1 !important; } }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: '[data-zoom-wrap]{opacity:1!important}' }} />
        </noscript>
        {children}
        <PageReady />
        {process.env.NODE_ENV === 'development' && <HotReload />}
      </body>
    </html>
  )
}
