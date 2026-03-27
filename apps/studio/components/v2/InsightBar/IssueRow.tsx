'use client'

import Link from 'next/link'

export function IssueRow({
  level,
  description,
  href,
  actionLabel,
}: {
  level: 'WARN' | 'ERROR'
  description: string
  href: string
  actionLabel: string
}) {
  const dotClass = level === 'ERROR' ? 'bg-destructive' : 'bg-warning'

  return (
    <div className="flex items-center gap-2 rounded border border-border px-2 py-1.5 hover:bg-surface-200">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span className="min-w-0 flex-1 truncate text-[10px] text-foreground">{description}</span>
      <Link href={href} className="shrink-0 text-[10px] text-brand hover:underline">
        {actionLabel}
      </Link>
    </div>
  )
}
