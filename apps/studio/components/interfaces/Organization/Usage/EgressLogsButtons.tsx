import { ListFilterIcon, TerminalIcon } from 'lucide-react'
import { Button } from 'ui'

/**
 * Example log queries, mirroring what an agent would run against the Supabase
 * MCP `explore_logs` tool. Kept simple on purpose — they are a starting point a
 * user can edit in the Logs Explorer.
 */
export const EGRESS_LOG_SQL: Record<EgressLogsKind, string> = {
  rest: `select
  request.path as path,
  count(*) as count
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
where request.path like '/rest/v1/%'
group by path
order by count desc
limit 20`,
  storage: `select
  request.path as path,
  (responseHeaders.cf_cache_status = 'HIT') as cached,
  count(*) as count
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  cross join unnest(response.headers) as responseHeaders
where request.path like '%storage/v1/object/%'
group by path, cached
order by count desc
limit 20`,
}

export type EgressLogsKind = 'rest' | 'storage'

export interface EgressLogsButtonsProps {
  projectRef: string
  /** Unified-logs log_type to filter by, e.g. "edge" or "storage" */
  logType?: string
  /** Optional pathname to pre-filter the logs view by */
  path?: string
  /** SQL to pre-fill in the Logs Explorer */
  sql: string
}

/**
 * The human equivalent of the agent MCP log-debugging flow: one button opens a
 * pre-filtered Logs view, the other opens the Logs Explorer with example SQL.
 * Reused on the usage page and the Egress observability report.
 */
export const EgressLogsButtons = ({
  projectRef,
  logType = 'edge',
  path,
  sql,
}: EgressLogsButtonsProps) => {
  const filters = [`log_type:eq:${logType}`]
  if (path) filters.push(`pathname:eq:${path}`)

  const logsUrl = `/project/${projectRef}/logs?filter=${filters.join(',')}`
  const explorerUrl = `/project/${projectRef}/logs/explorer?its=&ite=&s=${encodeURIComponent(sql)}`

  return (
    <div className="flex items-center gap-2">
      <Button asChild icon={<ListFilterIcon />}>
        <a href={logsUrl}>Open in Logs</a>
      </Button>
      <Button asChild icon={<TerminalIcon />}>
        <a href={explorerUrl}>Open in Logs Explorer</a>
      </Button>
    </div>
  )
}
