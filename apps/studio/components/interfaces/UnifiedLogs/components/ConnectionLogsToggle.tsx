import { useQueryStates } from 'nuqs'
import { Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'

export const ConnectionLogsToggle = () => {
  const [{ hide_connection_logs }, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label className="flex cursor-pointer items-center justify-between px-3 py-1.5">
          <span className="text-xs text-foreground-light">Connection logs</span>
          <Switch
            checked={!hide_connection_logs}
            onCheckedChange={(checked: boolean) => setSearch({ hide_connection_logs: !checked })}
          />
        </label>
      </TooltipTrigger>
      <TooltipContent side="right">Show Postgres connection events</TooltipContent>
    </Tooltip>
  )
}
