import type { Metadata } from 'next'
import './globals.css'
import { WEBSITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  title: {
    default: 'Kuladeep Mantri · cybersecurity engineer',
    template: '%s · Kuladeep Mantri',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
