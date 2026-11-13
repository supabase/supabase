import type { ReactNode } from 'react'
import { cn } from 'ui'

import { getNotchOutline } from './index'

export interface NotchOutlineProps {
  width: number
  surfaceClassName: string
  className?: string
  children?: ReactNode
}

export const NotchOutline = ({
  width,
  surfaceClassName,
  className,
  children,
}: NotchOutlineProps) => {
  const outline = getNotchOutline(width)

  return (
    <svg
      aria-hidden
      width={width + 8}
      height="40"
      viewBox={`0 0 ${width + 8} 40`}
      fill="none"
      className={cn('pointer-events-none absolute right-0 bottom-0 overflow-visible', className)}
    >
      <path d={outline} className={surfaceClassName} />
      <path d={outline} className="stroke-border" />
      {children}
    </svg>
  )
}
