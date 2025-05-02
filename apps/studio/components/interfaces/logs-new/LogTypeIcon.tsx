'use client'

import {
  Database,
  Key,
  Box,
  Server,
  LayoutList,
  AlertTriangle,
  HardDrive,
  Files,
  Globe,
} from 'lucide-react'
import { type LOG_TYPES } from './schema'
import { cn, TooltipContent, TooltipTrigger, Tooltip } from 'ui'
import { Auth, EdgeFunctions } from 'icons'

interface LogTypeIconProps {
  type: (typeof LOG_TYPES)[number]
  size?: number
  strokeWidth?: number
  className?: string
}

export const LogTypeIcon = ({
  type,
  size = 16,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  const iconMap = {
    edge: () => <Globe size={size} strokeWidth={strokeWidth} className={className} />,
    auth: () => <Auth size={size} strokeWidth={strokeWidth} className={className} />,
    'edge function': () => (
      <EdgeFunctions size={size} strokeWidth={strokeWidth} className={className} />
    ),
    postgres: () => <Database size={size} strokeWidth={strokeWidth} className={className} />,
    'function events': () => (
      <EdgeFunctions size={size} strokeWidth={strokeWidth} className={className} />
    ),
    supavisor: () => <Server size={size} strokeWidth={strokeWidth} className={className} />,
    'postgres upgrade': () => (
      <HardDrive size={size} strokeWidth={strokeWidth} className={className} />
    ),
    storage: () => <Files size={size} strokeWidth={strokeWidth} className={className} />,
  }

  const IconComponent =
    iconMap[type] || (() => <Box size={size} strokeWidth={strokeWidth} className={className} />)

  return (
    <Tooltip>
      <TooltipTrigger>
        <IconComponent />
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-sm">{type}</div>
      </TooltipContent>
    </Tooltip>
  )
}

export const LogTypeIconWithText = ({
  type,
  size = 16,
  strokeWidth = 1.5,
  className,
}: LogTypeIconProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogTypeIcon type={type} size={size} strokeWidth={strokeWidth} />
      <span>{type}</span>
    </div>
  )
}
