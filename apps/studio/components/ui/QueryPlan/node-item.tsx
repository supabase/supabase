import type { PropsWithChildren } from 'react'

import { cn } from 'ui'

type NodeItemProps = {
  title?: string
  heightClass?: string
  className?: string
}

export const NodeItem = ({
  children,
  title,
  heightClass = 'h-[22px]',
  className,
}: PropsWithChildren<NodeItemProps>) => {
  return (
    <li
      title={title}
      className={cn(
        'text-[8px] leading-5 relative px-2 flex flex-row items-center justify-between',
        'bg-surface-100',
        'border-t',
        'border-t-[0.5px]',
        'hover:bg-scale-500 transition-[background-color] cursor-default',
        heightClass,
        className
      )}
    >
      {children}
    </li>
  )
}
