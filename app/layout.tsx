import type { Metadata } from 'next'
import './globals.css'
import HotReload from './components/HotReload'

export const metadata: Metadata = {
  title: 'Resume',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <HotReload />}
      </body>
    </html>
  )
}
