import { useQueryStates } from 'nuqs'
import { Switch } from 'ui'

import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'

export const ConnectionLogsToggle = () => {
  const [{ hide_connection_logs }, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-border bg-surface-100 px-3 py-2 mx-2 mt-2 mb-1">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-medium text-foreground">Connection logs</p>
        <p className="text-xs leading-tight text-foreground-lighter">
          Show Postgres connection events
        </p>
      </div>
      <Switch
        checked={!hide_connection_logs}
        onCheckedChange={(checked: boolean) => setSearch({ hide_connection_logs: !checked })}
        className="mt-0.5 shrink-0"
      />
    </label>
  )
}
