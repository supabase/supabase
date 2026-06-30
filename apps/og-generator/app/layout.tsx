import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OG Image Generator — Supabase',
  description:
    'Internal tool to generate on-brand OG & thumbnail images for supabase.com/blog posts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Dark mode only (per brief §4). `dark` activates the Supabase dark theme tokens.
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
