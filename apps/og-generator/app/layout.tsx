import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Supaimage — Supabase',
  description:
    'Internal tool to generate on-brand social images (OG, Thumb, Twitter/X, more) for Supabase and its sub-brands',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // App chrome is light mode. (The generated IMAGE is still dark-only per brief
  // §4 — that's the renderer's design tokens, independent of this chrome theme.)
  return (
    <html lang="en" className="light">
      <body className="h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  )
}
