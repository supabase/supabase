import * as React from 'react'
import { cn } from '../../lib/utils/cn'
import { useHorizontalScroll } from '../hooks/use-horizontal-scroll'

interface ShadowScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ShadowScrollArea = React.forwardRef<HTMLDivElement, ShadowScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { hasHorizontalScroll, canScrollLeft, canScrollRight } = useHorizontalScroll(containerRef)

    return (
      <div className="relative">
        <div
          className={cn(
            'absolute inset-0 pointer-events-none z-10',
            'before:absolute before:top-0 before:right-0 before:bottom-0 before:w-6 before:bg-gradient-to-l before:from-black/20 before:to-transparent before:opacity-0 before:transition-all before:duration-400 before:easing-[0.24, 0.25, 0.05, 1]',
            'after:absolute after:top-0 after:left-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-black/20 after:to-transparent after:opacity-0 after:transition-all after:duration-400 after:easing-[0.24, 0.25, 0.05, 1]',
            hasHorizontalScroll && 'hover:before:opacity-100 hover:after:opacity-100',
            canScrollRight && 'before:opacity-100',
            canScrollLeft && 'after:opacity-100'
          )}
        />
        <div ref={containerRef} className={cn('w-full overflow-auto', className)} {...props}>
          {children}
        </div>
      </div>
    )
  }
)

ShadowScrollArea.displayName = 'ShadowScrollArea'

export { ShadowScrollArea }
