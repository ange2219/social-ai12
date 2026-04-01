import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PWAInstall } from '@/components/PWAInstall'

export const metadata: Metadata = {
  title: 'Social IA — Assistant Community Manager',
  description: 'Gérez tous vos réseaux sociaux avec l\'intelligence artificielle.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Social IA',
  },
  icons: {
    apple: '/icons/apple-touch-icon.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B7BF6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>
        {children}
        <PWAInstall />
      </body>
    </html>
  )
}
