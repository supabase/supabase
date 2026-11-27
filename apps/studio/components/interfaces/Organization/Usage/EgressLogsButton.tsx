import { TerminalIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

// Example egress query: top paths by response bytes over the last 24 hours.
// Storage paths are grouped by bucket. HEAD requests are excluded from the byte
// sum (HEAD sends no body but carries a content_length header). The user can
// edit this in the Logs Explorer. Mirrors what an agent would run via MCP `query_logs`.
const EGRESS_LOGS_SQL = `select
  coalesce(
    concat(
      regexp_extract(request.path, r'^(/storage/v1/(?:object|render)/(?:public|authenticated)/[^/]+)'),
      '/*'
    ),
    request.path
  ) as path,
  count(*) as requests,
  sum(
    if(
      request.method = 'HEAD',
      0,
      cast(coalesce(resp_headers.content_length, '0') as int64)
    )
  ) as egress_bytes
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  cross join unnest(response.headers) as resp_headers
group by path
order by egress_bytes desc
limit 20`

/**
 * Opens the Logs Explorer with an example egress query pre-filled. Shown in the
 * usage Egress section. Disabled with a tooltip when no single project is
 * selected, since the Logs Explorer is project-scoped.
 *
 * A companion "Open in Logs" filter link is deferred — the unified-logs filter
 * params do not pass correctly yet.
 */
export const EgressLogsButton = () => {
  const [{ projectRef }] = useQueryStates({ projectRef: parseAsString })

  if (!projectRef) {
    return (
      <ButtonTooltip
        disabled
        icon={<TerminalIcon />}
        tooltip={{
          content: { side: 'bottom', text: 'Select a single project to open the Logs Explorer' },
        }}
      >
        Open in Logs Explorer
      </ButtonTooltip>
    )
  }

  const url = `/project/${projectRef}/logs/explorer?its=&ite=&s=${encodeURIComponent(EGRESS_LOGS_SQL)}`

  return (
    <Button asChild icon={<TerminalIcon />}>
      <a href={url}>Open in Logs Explorer</a>
    </Button>
  )
}
