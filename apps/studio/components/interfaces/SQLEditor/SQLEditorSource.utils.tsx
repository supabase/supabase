import { Database, ScrollText } from 'lucide-react'
import { cn } from 'ui'

import type { SnippetWithContent } from '@/state/sql-editor-v2'
import type { SqlSnippets } from '@/types'

export const DEFAULT_SQL_SNIPPET_SOURCE: SqlSnippets.Source = 'project'

export const SQL_SNIPPET_SOURCE_LABELS: Record<SqlSnippets.Source, string> = {
  project: 'Project',
  logs: 'Logs',
}

export function getSqlSnippetSource(
  snippet?: Pick<SnippetWithContent, 'content'> | null
): SqlSnippets.Source {
  return snippet?.content?.source ?? DEFAULT_SQL_SNIPPET_SOURCE
}

export function SqlSnippetSourceIcon({
  source,
  size = 15,
  strokeWidth = 1.5,
  className,
}: {
  source?: SqlSnippets.Source
  size?: number
  strokeWidth?: number
  className?: string
}) {
  if (source === 'logs') {
    return (
      <ScrollText
        size={size}
        strokeWidth={strokeWidth}
        className={cn(
          'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground transition-colors',
          className
        )}
      />
    )
  }

  return (
    <Database
      size={size}
      strokeWidth={strokeWidth}
      className={cn(
        'text-foreground-muted group-hover:text-foreground-lighter group-aria-selected:text-foreground transition-colors',
        className
      )}
    />
  )
}
