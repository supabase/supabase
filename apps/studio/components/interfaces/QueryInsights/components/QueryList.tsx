import { useEffect, useState } from 'react'
import { Clock, Database } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Button } from 'ui'

dayjs.extend(relativeTime)

interface Query {
  query_id: string
  query: string
  total_time: number
  calls: number
  rows: number
  shared_blks_read: number
  shared_blks_hit: number
  mean_exec_time: number
  database: string
  timestamp: string
}

interface QueryListProps {
  queries?: Query[]
  isLoading?: boolean
}

export const QueryList = ({ queries = [], isLoading = false }: QueryListProps) => {
  const [expandedQueries, setExpandedQueries] = useState<Set<string>>(new Set())

  const toggleQueryExpansion = (queryId: string) => {
    const newExpanded = new Set(expandedQueries)
    if (newExpanded.has(queryId)) {
      newExpanded.delete(queryId)
    } else {
      newExpanded.add(queryId)
    }
    setExpandedQueries(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse">Loading queries...</div>
      </div>
    )
  }

  if (queries.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-foreground-light">
        No queries found for the selected time range
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {queries.map((query) => (
        <div
          key={query.query_id}
          className="rounded-md border border-default bg-surface-100 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-grow">
                <div className="font-mono text-xs text-foreground-light break-all">
                  {expandedQueries.has(query.query_id) ? (
                    query.query
                  ) : (
                    <>
                      {query.query.slice(0, 100)}
                      {query.query.length > 100 && '...'}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-x-4 text-xs text-foreground-light">
                  <div className="flex items-center gap-x-1">
                    <Database strokeWidth={1.5} size={14} />
                    <span>{query.database}</span>
                  </div>
                  <div className="flex items-center gap-x-1">
                    <Clock strokeWidth={1.5} size={14} />
                    <span>{dayjs(query.timestamp).fromNow()}</span>
                  </div>
                </div>
              </div>
              {query.query.length > 100 && (
                <Button
                  type="default"
                  size="tiny"
                  onClick={() => toggleQueryExpansion(query.query_id)}
                >
                  {expandedQueries.has(query.query_id) ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-foreground-light mb-1">Total time</div>
                <div className="text-sm">{query.total_time.toFixed(2)}ms</div>
              </div>
              <div>
                <div className="text-xs text-foreground-light mb-1">Calls</div>
                <div className="text-sm">{query.calls}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-light mb-1">Rows</div>
                <div className="text-sm">
                  {query.rows >= 1000 ? `${(query.rows / 1000).toFixed(1)}k` : query.rows}
                </div>
              </div>
              <div>
                <div className="text-xs text-foreground-light mb-1">Cache hit ratio</div>
                <div className="text-sm">
                  {(
                    (query.shared_blks_hit / (query.shared_blks_hit + query.shared_blks_read)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
