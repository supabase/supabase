import type { PropsWithChildren } from 'react'

import { cn } from 'ui'
import { DEFAULT_NODE_HEIGHT_CONSTANTS } from './constants'

type NodeItemProps = {
  title?: string
  heightValue?: number
  className?: string
}

export const NodeItem = ({
  children,
  title,
  heightValue = DEFAULT_NODE_HEIGHT_CONSTANTS.ITEM_H,
  className,
}: PropsWithChildren<NodeItemProps>) => {
  return (
    <li
      title={title}
      style={{ height: `${heightValue}px` }}
      className={cn(
        'text-[8px] leading-5 relative px-2 flex flex-row items-center justify-between',
        'bg-surface-100',
        'border-t',
        'border-t-[0.5px]',
        'hover:bg-scale-500 transition-[background-color] cursor-default',
        className
      )}
    >
      {children}
    </li>
  )
}
