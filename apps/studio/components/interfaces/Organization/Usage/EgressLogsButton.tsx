import { TerminalIcon } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { Button } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

// Example egress query: top REST API paths by request count, with the
// user-agent and client IP so you can see WHO is calling, not just what. The
// user can edit it in the Logs Explorer. Mirrors what an agent would run via
// MCP `query_logs`.
const EGRESS_LOGS_SQL = `select
  request.path as path,
  headers.user_agent as user_agent,
  headers.cf_connecting_ip as ip,
  count(*) as count
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(request.headers) as headers
where request.path like '/rest/v1/%'
group by path, user_agent, ip
order by count desc
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
