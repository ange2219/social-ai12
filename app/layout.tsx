import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Social IA — Assistant Community Manager',
  description: 'Gérez tous vos réseaux sociaux avec l\'intelligence artificielle.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  )
}
