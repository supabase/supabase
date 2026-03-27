'use client'

import { usePathname } from 'next/navigation'

export function StaticTitle() {
  const pathname = usePathname()
  const segment = pathname?.split('/').filter(Boolean).slice(-2) ?? []
  const title = segment[segment.length - 1] ?? 'Overview'
  const formatted = title.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="px-4 py-2 border-b border-border bg-background shrink-0">
      <h1 className="text-sm font-medium text-foreground">{formatted}</h1>
    </div>
  )
}
