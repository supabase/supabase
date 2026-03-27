'use client'

import { useProjectLintsQuery } from 'data/lint/lint-query'
import Link from 'next/link'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function AdvisorsPanel() {
  const { projectRef } = useV2Params()
  const { data: lints, isPending, isError } = useProjectLintsQuery({ projectRef })

  if (isPending) return <ShimmeringLoader className="m-3 h-8" />
  if (isError) return <p className="p-3 text-sm text-destructive">Failed to load advisors.</p>

  const list = lints ?? []
  if (list.length === 0) {
    return (
      <div className="p-3 text-sm text-foreground-lighter">
        No advisor warnings. Your project looks good.
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {list.slice(0, 20).map((lint, i) => (
        <Link
          key={lint.cache_key ?? i}
          href={
            projectRef
              ? `/project/${projectRef}/advisors/security?preset=${lint.level}&id=${lint.cache_key}`
              : '#'
          }
          className="block p-2 rounded border border-border hover:bg-sidebar-accent text-left"
        >
          <div className="text-xs font-medium text-foreground">{lint.name}</div>
          <div className="text-xs text-foreground-lighter truncate">{lint.description}</div>
          <span
            className={`inline-block mt-1 text-[10px] px-1.5 py-0 rounded ${
              lint.level === 'ERROR'
                ? 'bg-destructive/20 text-destructive'
                : lint.level === 'WARN'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-foreground-lighter'
            }`}
          >
            {lint.level}
          </span>
        </Link>
      ))}
    </div>
  )
}
