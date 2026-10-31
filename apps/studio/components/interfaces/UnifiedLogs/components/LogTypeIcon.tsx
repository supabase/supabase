import { Auth, Compute, EdgeFunctions, Realtime, Storage } from 'icons'
import {
  BoxIcon,
  CableIcon,
  Code2Icon,
  DatabaseIcon,
  NetworkIcon,
  TerminalIcon,
  WorkflowIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { LOG_TYPES_LABELS } from '../UnifiedLogs.constants'

interface LogTypeIconProps {
  type: string
  size?: number
  strokeWidth?: number
  className?: string
}

type IconComponent = typeof BoxIcon | typeof Auth

// [Alaister]: commented out types coming in the future
// edge: Globe,
const ICON_MAP = new Map<string, IconComponent>([
  ['postgrest', Code2Icon],
  ['auth', Auth],
  ['edge function', EdgeFunctions],
  ['edge function runtime', TerminalIcon],
  ['postgres', DatabaseIcon],
  ['storage', Storage],
  ['realtime', Realtime],
  ['supavisor', CableIcon],
  ['pgbouncer', CableIcon],
  ['multigres', NetworkIcon],
  ['pipelines', WorkflowIcon],
  ['compute', Compute],
])

export const LogTypeIcon = ({
  type,
  size = 14,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  const Icon = ICON_MAP.get(type) ?? BoxIcon
  const label = type === 'pipelines' ? LOG_TYPES_LABELS.pipelines : type

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" role="img" aria-label={label}>
          <Icon size={size} strokeWidth={strokeWidth} className={className} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-xs">{label}</div>
      </TooltipContent>
    </Tooltip>
  )
}
