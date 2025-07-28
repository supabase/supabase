import { PropsWithChildren, MouseEvent } from 'react'

import { cn } from 'ui'

interface ValueContainerProps {
  isSelected?: boolean
  className?: string
  onClick?: (event: MouseEvent<HTMLElement>) => void
}

export const ValueContainer = ({
  children,
  isSelected = false,
  className,
  onClick,
}: PropsWithChildren<ValueContainerProps>) => (
  <div
    className={cn(
      'bg-surface-100 hover:bg-surface-200 border-default text-foreground flex items-center',
      'transition justify-between gap-2 border px-6 py-4 text-sm',
      'first:rounded-tr first:rounded-tl last:rounded-br last:rounded-bl',
      isSelected ? '!bg-surface-300' : '',
      onClick ? 'cursor-pointer' : '',
      className
    )}
    onClick={(e) => {
      if (onClick) onClick(e)
    }}
  >
    {children}
  </div>
)
