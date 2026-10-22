import { Auth, Compute, EdgeFunctions, Realtime, Storage } from 'icons'
import { BoxIcon, CableIcon, Code2Icon, DatabaseIcon, NetworkIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

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
  ['postgres', DatabaseIcon],
  ['storage', Storage],
  ['realtime', Realtime],
  ['supavisor', CableIcon],
  ['pgbouncer', CableIcon],
  ['multigres', NetworkIcon],
  ['compute', Compute],
])

export const LogTypeIcon = ({
  type,
  size = 14,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  const Icon = ICON_MAP.get(type) ?? BoxIcon

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
