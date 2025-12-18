import type { PropsWithChildren, ReactNode } from 'react'

import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { DEFAULT_NODE_HEIGHT_CONSTANTS } from './constants'

type NodeItemProps = {
  tooltip?: ReactNode
  height?: number
  className?: string
}

export const NodeItem = ({
  children,
  tooltip,
  height = DEFAULT_NODE_HEIGHT_CONSTANTS.ITEM_H,
  className,
}: PropsWithChildren<NodeItemProps>) => {
  const item = (
    <li
      style={{ height: `${height}px` }}
      className={cn(
        'text-[8px] leading-5 relative px-2 flex flex-row items-center justify-between',
        'bg-surface-100',
        'border-t',
        'border-t-[0.5px]',
        'hover:bg-scale-500 transition-[background-color]',
        className
      )}
    >
      {children}
    </li>
  )

  if (!tooltip) return item

  return (
    <Tooltip>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="right" align="start" className="max-w-[240px] text-[11px] leading-4">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
