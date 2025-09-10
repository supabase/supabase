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
        'text-[8px] leading-5 relative flex flex-row justify-items-start',
        'bg-surface-100',
        'border-t',
        'border-t-[0.5px]',
        'hover:bg-scale-500 transition cursor-default',
        heightClass,
        className
      )}
    >
      <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
        {children}
      </div>
    </li>
  )
}
