import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TerraShield · Climate risk intelligence',
  description: 'Localized, explainable climate-risk intelligence for communities and planners.',
  generator: 'TerraShield',
}

export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#18332b' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
