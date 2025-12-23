import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Authorize Application',
  description: 'OAuth consent page for MCP server authorization',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
