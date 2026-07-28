import { useParams } from 'common'
import { Database, ScrollText } from 'lucide-react'
import { useRouter } from 'next/router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { type SqlSnippetSource } from '../querySource'

const SOURCE_LABEL: Record<SqlSnippetSource, string> = {
  database: 'Database',
  logs: 'Logs',
}

/**
 * An honest indicator of a snippet's query source — not a selector. A snippet's
 * source is immutable, so the dropdown offers a creation action for the *other*
 * source (opening a fresh tab via the existing `/sql/new` flow) rather than a
 * toggle that would silently invalidate the current query.
 */
export const QuerySourceIndicator = ({ source }: { source: SqlSnippetSource }) => {
  const { ref } = useParams()
  const router = useRouter()

  const isLogs = source === 'logs'
  const targetSource: SqlSnippetSource = isLogs ? 'database' : 'logs'

  const createSnippet = (target: SqlSnippetSource) => {
    if (!ref) return
    const suffix = target === 'logs' ? '&source=logs' : ''
    // skip=true bypasses the "load last visited snippet" redirect on /sql/new.
    router.push(`/project/${ref}/sql/new?skip=true${suffix}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          aria-label={`Query source: ${SOURCE_LABEL[source]}`}
          icon={
            isLogs ? (
              <ScrollText className="text-foreground-light" />
            ) : (
              <Database className="text-foreground-light" />
            )
          }
        >
          {SOURCE_LABEL[source]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel>
          {isLogs ? 'This snippet queries logs' : 'This snippet queries the database'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-x-2" onClick={() => createSnippet(targetSource)}>
          {targetSource === 'logs' ? (
            <ScrollText size={14} className="text-foreground-light" />
          ) : (
            <Database size={14} className="text-foreground-light" />
          )}
          New {SOURCE_LABEL[targetSource].toLowerCase()} query
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
