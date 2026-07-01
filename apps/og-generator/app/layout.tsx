import type { Metadata } from 'next'

import { DialRoot } from 'dialkit'
import 'dialkit/styles.css'

import './globals.css'

export const metadata: Metadata = {
  title: 'OG Image Generator — Supabase',
  description:
    'Internal tool to generate on-brand OG & thumbnail images for supabase.com/blog posts',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // App chrome is light mode. (The generated IMAGE is still dark-only per brief
  // §4 — that's the renderer's design tokens, independent of this chrome theme.)
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        {/* DialKit live-tuning panel — a sibling of {children}, not wrapping it.
            Dev-only so it never shows to end users; delete the guard to always
            render it. Controls appear once components register dials via useDialKit. */}
        {process.env.NODE_ENV === 'development' && <DialRoot />}
      </body>
    </html>
  )
}
