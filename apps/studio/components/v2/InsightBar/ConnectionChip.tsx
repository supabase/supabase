'use client'

import Link from 'next/link'

const CHIP_COLORS: Record<string, string> = {
  RLS: 'bg-green-500/20 text-green-900 border-green-700/80',
  IDX: 'bg-blue-500/20 text-blue-900 border-blue-700/80',
  AUTH: 'bg-purple-500/20 text-purple-900 border-purple-700/80',
  FN: 'bg-amber-500/20 text-amber-900 border-amber-700/80',
  RT: 'bg-teal-500/10 text-teal-800 border-teal-700/80',
  FK: 'bg-foreground/10 text-foreground-light border-border',
}

export function ConnectionChip({
  type,
  label,
  href,
}: {
  type: 'RLS' | 'IDX' | 'AUTH' | 'FN' | 'RT' | 'FK'
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-sm bg-surface-100 border border-border p-1 text-xs hover:border-foreground-light hover:bg-surface-200"
    >
      <span className={`rounded border px-1 py-0.5 text-[9px] font-medium ${CHIP_COLORS[type]}`}>
        {type}
      </span>
      <span className="text-foreground-light">{label}</span>
    </Link>
  )
}
