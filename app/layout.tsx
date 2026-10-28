import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeSync } from '@/components/theme-sync'

export const metadata: Metadata = {
  title: 'LifeGrowth — How will you live in retirement?',
  description: 'Round up your card payments, grow your Pillar III pension, and see how you will live in retirement.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  // App-like on phones: no pinch or double-tap zoom.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeSync />
        {children}
      </body>
    </html>
  )
}
