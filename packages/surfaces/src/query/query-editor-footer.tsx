import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import type { LogWindow, QuerySource } from '../contract'
import { QueryResultFooter } from '../explorer/query-result-footer'
import { MAX_TABLE_OFFSET, type QueryResult } from './query-model'
import { logWindowLabel } from './query-source'

const PAGE_SIZES = [25, 50, 100, 200]

interface QueryEditorFooterProps {
  result?: QueryResult
  isBusy: boolean
  isStale: boolean
  elapsedMs?: number
  limit: number
  source: QuerySource
  logWindow?: LogWindow
  onPage: (offset: number, limit: number) => void
}

function logWindowTitle(logWindow?: LogWindow) {
  if (!logWindow) return 'Queries the last 24 hours'
  const start = new Date(logWindow.iso_timestamp_start).toLocaleString()
  const end = new Date(logWindow.iso_timestamp_end).toLocaleString()
  return `${start} – ${end}`
}

export function QueryEditorFooter({
  result,
  isBusy,
  isStale,
  elapsedMs,
  limit,
  source,
  logWindow,
  onPage,
}: QueryEditorFooterProps) {
  const offset = result?.offset ?? 0
  const isPaginated = !!result?.paginated
  const canGoBack = !isBusy && !isStale && offset > 0
  const canGoForward =
    !isBusy && !isStale && !!result?.hasMore && offset + limit <= MAX_TABLE_OFFSET
  const shouldShowElapsed = !!result && !isBusy && elapsedMs !== undefined

  return (
    <QueryResultFooter
      count={result?.rows.length ?? 0}
      actions={
        <div className="flex items-center gap-2">
          {source === 'logs' && (
            <span title={logWindowTitle(logWindow)}>Logs · {logWindowLabel(logWindow)}</span>
          )}
          {isPaginated && (
            <>
              <span>Rows per page</span>
              <Select
                value={String(limit)}
                disabled={isBusy || isStale}
                onValueChange={(value) => onPage(0, Number(value))}
              >
                <SelectTrigger size="tiny" aria-label="Rows per page" className="w-auto gap-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="text"
                size="tiny"
                className="w-7 px-0"
                aria-label="Previous page"
                disabled={!canGoBack}
                icon={<ChevronLeftIcon size={14} />}
                onClick={() => onPage(Math.max(0, offset - limit), limit)}
              />
              <span className="tabular-nums text-foreground-light">
                {Math.floor(offset / limit) + 1}
              </span>
              <Button
                variant="text"
                size="tiny"
                className="w-7 px-0"
                aria-label="Next page"
                disabled={!canGoForward}
                icon={<ChevronRightIcon size={14} />}
                onClick={() => onPage(offset + limit, limit)}
              />
            </>
          )}
        </div>
      }
    >
      {isBusy && <span className="text-foreground-light">Running…</span>}
      {shouldShowElapsed && <span>· {elapsedMs} ms</span>}
    </QueryResultFooter>
  )
}
