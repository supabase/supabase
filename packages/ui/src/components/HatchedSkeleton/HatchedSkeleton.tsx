import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'
import styles from './hatched-skeleton.module.css'

const BASE_SWEEP_SECONDS = 1.8

export interface HatchedSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Multiplier for the light sweep. */
  speed?: number
  /** Renders the block slightly recessed, with a soft inner shadow and an inner light edge. */
  inset?: boolean
}

/**
 * Experimental. A classic muted skeleton with barely-visible diagonal hairlines for a hint of
 * material, and a quick light sweep. Pure CSS: the sweep is a `transform` animation on a
 * pseudo-element, so it runs on the compositor with no JavaScript or per-frame repaint.
 */
export function HatchedSkeleton({
  className,
  speed = 1,
  inset = false,
  style,
  ...props
}: HatchedSkeletonProps) {
  const sweepDuration = `${BASE_SWEEP_SECONDS / Math.max(speed, 0.01)}s`

  return (
    <div
      aria-hidden
      className={cn(
        styles.root,
        inset && styles.inset,
        'rounded-md bg-muted text-foreground-lighter',
        className
      )}
      style={{ '--hs-sweep-duration': sweepDuration, ...style } as CSSProperties}
      {...props}
    />
  )
}
