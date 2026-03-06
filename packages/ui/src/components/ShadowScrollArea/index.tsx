'use client'

import * as React from 'react'

import { cn } from '../../lib/utils/cn'
import { useHorizontalScroll } from '../hooks/use-horizontal-scroll'

interface ShadowScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  containerClassName?: string
  stickyLastColumn?: boolean
  outerContainerRef?: React.Ref<HTMLDivElement>
}

/**
 * [Joshen] Leaving feedback here to address in the future
   We should pull out all the sticky column logic, shift them to Table component where we can declare
   sticky columns via a prop. ShadowScrollArea here should purely handle the shadow styling
 */

const ShadowScrollArea = React.forwardRef<HTMLDivElement, ShadowScrollAreaProps>(
  (
    { className, containerClassName, children, stickyLastColumn, outerContainerRef, ...props },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const { hasHorizontalScroll, canScrollLeft, canScrollRight } = useHorizontalScroll(containerRef)

    const stickyColumnShadow = cn(
      '[&_td:last-child]:before:absolute [&_td:last-child]:before:top-0 [&_td:last-child]:before:-left-6',
      '[&_td:last-child]:before:bottom-0 [&_td:last-child]:before:w-6 [&_td:last-child]:before:bg-gradient-to-l',
      '[&_td:last-child]:before:from-black/5 dark:[&_td:last-child]:before:from-black/20 [&_td:last-child]:before:to-transparent',
      '[&_td:last-child]:before:opacity-0 [&_td:last-child]:before:transition-all [&_td:last-child]:before:duration-400',
      '[&_td:last-child]:before:easing-[0.24, 0.25, 0.05, 1] [&_td:last-child]:before:z-[39]',
      '[&_th:last-child]:before:absolute [&_th:last-child]:before:top-0 [&_th:last-child]:before:-left-6',
      '[&_th:last-child]:before:bottom-0 [&_th:last-child]:before:w-6 [&_th:last-child]:before:bg-gradient-to-l',
      '[&_th:last-child]:before:from-black/5 dark:[&_th:last-child]:before:from-black/20 [&_th:last-child]:before:to-transparent',
      '[&_th:last-child]:before:opacity-0 [&_th:last-child]:before:transition-all [&_th:last-child]:before:duration-400',
      '[&_th:last-child]:before:easing-[0.24, 0.25, 0.05, 1] [&_th:last-child]:before:z-[39]'
    )

    return (
      <div ref={outerContainerRef} className={cn(containerClassName, 'relative')}>
        <div
          className={cn(
            'absolute inset-0 pointer-events-none z-[38]',
            'before:absolute before:top-0 before:right-0 before:bottom-0 before:w-6 before:bg-gradient-to-l before:from-black/5 dark:before:from-black/20 before:to-transparent before:opacity-0 before:transition-all before:duration-400 before:easing-[0.24, 0.25, 0.05, 1]',
            'after:absolute after:top-0 after:left-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-black/5 dark:after:from-black/20 after:to-transparent after:opacity-0 after:transition-all after:duration-400 after:easing-[0.24, 0.25, 0.05, 1]',
            hasHorizontalScroll && 'hover:before:opacity-100 hover:after:opacity-100',
            canScrollRight && 'before:opacity-100',
            canScrollLeft && 'after:opacity-100'
          )}
        />
        <div
          ref={containerRef}
          className={cn(
            'w-full overflow-auto',
            stickyLastColumn && [
              '[&_tr>*:last-child]:sticky [&_tr>*:last-child]:z-[38] [&_tr>*:last-child]:right-0',
              '[&_tr:hover>*:last-child]:bg-transparent',
              '[&_th>*:last-child]:bg-surface-100',
              stickyColumnShadow,
            ],
            hasHorizontalScroll && '[&_tr:hover>td:last-child]:!bg-surface-200',
            canScrollRight &&
              '[&_td]:before:opacity-100 [&_tr>*:last-child]:before:opacity-100 [&_th:last-child]:before:opacity-100',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

ShadowScrollArea.displayName = 'ShadowScrollArea'

export { ShadowScrollArea }
