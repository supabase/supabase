import { Auth, EdgeFunctions, Realtime, Storage } from 'icons'
import { Box, Cable, Code2, Database } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { type LOG_TYPES } from '../UnifiedLogs.constants'

interface LogTypeIconProps {
  type: (typeof LOG_TYPES)[number]
  size?: number
  strokeWidth?: number
  className?: string
}

type IconComponent = React.ComponentType<{
  size?: number
  strokeWidth?: number
  className?: string
}>

// [Alaister]: commented out types coming in the future
// edge: Globe,
const ICON_MAP: Partial<Record<(typeof LOG_TYPES)[number], IconComponent>> = {
  postgrest: Code2,
  auth: Auth,
  'edge function': EdgeFunctions,
  postgres: Database,
  storage: Storage,
  realtime: Realtime,
  supavisor: Cable,
  pgbouncer: Cable,
}

export const LogTypeIcon = ({
  type,
  size = 16,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  const Icon = ICON_MAP[type] ?? Box

  return (
    <Tooltip>
      <TooltipTrigger>
        <Icon size={size} strokeWidth={strokeWidth} className={className} />
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-xs">{type}</div>
      </TooltipContent>
    </Tooltip>
  )
}
