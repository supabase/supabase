import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '../../lib/utils/cn'
import styles from './gradient-skeleton.module.css'

const BASE_SWEEP_SECONDS = 2.6

export interface GradientSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Multiplier for the shine sweep. The drifting light underneath is unaffected. */
  speed?: number
}

/**
 * A CSS-only loading placeholder. A monotone light sweeps across slow, drifting pools of
 * light, and every instance on the page shares the same viewport-anchored gradients.
 */
export function GradientSkeleton({ className, speed = 1, style, ...props }: GradientSkeletonProps) {
  const sweepDuration = `${BASE_SWEEP_SECONDS / Math.max(speed, 0.01)}s`

  return (
    <div
      aria-hidden
      className={cn(styles.root, 'rounded-md bg-muted text-foreground-lighter', className)}
      style={{ '--gs-sweep-duration': sweepDuration, ...style } as CSSProperties}
      {...props}
    />
  )
}
