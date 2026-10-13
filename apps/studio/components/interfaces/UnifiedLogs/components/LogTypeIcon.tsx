import { Auth, Compute, EdgeFunctions, Realtime, Storage } from 'icons'
import { Box, Cable, Code2, Database, Network } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface LogTypeIconProps {
  type: string
  size?: number
  strokeWidth?: number
  className?: string
}

type IconComponent = typeof Box | typeof Auth

// [Alaister]: commented out types coming in the future
// edge: Globe,
const ICON_MAP = new Map<string, IconComponent>([
  ['postgrest', Code2],
  ['auth', Auth],
  ['edge function', EdgeFunctions],
  ['postgres', Database],
  ['storage', Storage],
  ['realtime', Realtime],
  ['supavisor', Cable],
  ['pgbouncer', Cable],
  ['multigres', Network],
  ['compute', Compute],
])

export const LogTypeIcon = ({
  type,
  size = 14,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  const Icon = ICON_MAP.get(type) ?? Box

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" role="img" aria-label={type}>
          <Icon size={size} strokeWidth={strokeWidth} className={className} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-xs">{type}</div>
      </TooltipContent>
    </Tooltip>
  )
}
