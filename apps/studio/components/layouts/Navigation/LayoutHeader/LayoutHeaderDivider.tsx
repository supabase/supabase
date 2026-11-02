import type { HTMLProps } from 'react'
import { cn } from 'ui'

export const LayoutHeaderDivider = ({ className, ...props }: HTMLProps<HTMLSpanElement>) => (
  <span className={cn('text-border-stronger pr-2', className)} {...props}>
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
      aria-hidden={true}
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)
