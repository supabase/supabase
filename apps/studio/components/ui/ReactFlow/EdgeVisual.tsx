import { ArrowRight, Loader2, Square, X, type LucideIcon } from 'lucide-react'
import { cn } from 'ui'

export interface ReplicationState {
  isComingUp: boolean
  isReplicating: boolean
  isFailed: boolean
}

export interface EdgeVisual {
  Icon: LucideIcon
  // CSS color shared by the icon and the connecting line so they always match.
  color: string
  opacity: number
  dashArray: string
  shouldAnimate: boolean
  shouldSpin?: boolean
  isFilled?: boolean
  strokeWidth?: number
  // The icon depicts the flow direction (it points right, matching a
  // left-to-right layout) — edges in other layouts must rotate it to match
  // their actual direction.
  isDirectional?: boolean
}

// Picks the icon + line appearance for a replication state. Both the icon and the line are derived
// here from the same state so they always stay in sync. We deliberately don't surface lag: the line
// just communicates whether data is moving, stopped, starting, or broken.
export const getEdgeVisual = ({
  isComingUp,
  isReplicating,
  isFailed,
}: ReplicationState): EdgeVisual => {
  if (isFailed) {
    return {
      Icon: X,
      color: 'hsl(var(--destructive-default))',
      opacity: 1,
      dashArray: '5 5',
      shouldAnimate: false,
      strokeWidth: 4,
    }
  }
  if (isComingUp) {
    return {
      Icon: Loader2,
      color: 'var(--foreground-light)',
      opacity: 1,
      dashArray: '5',
      shouldAnimate: true,
      shouldSpin: true,
    }
  }
  if (isReplicating) {
    return {
      Icon: ArrowRight,
      color: 'hsl(var(--brand-default))',
      opacity: 1,
      dashArray: '5',
      shouldAnimate: true,
      isDirectional: true,
    }
  }
  return {
    Icon: Square,
    color: 'var(--foreground-lighter)',
    opacity: 0.5,
    dashArray: '5 5',
    shouldAnimate: false,
    isFilled: true,
  }
}

/**
 * The icon half of an edge visual, for the small chip rendered mid-edge.
 * Pass `rotation` (degrees) to orient directional icons in layouts that
 * aren't left-to-right.
 */
export const EdgeVisualIcon = ({ visual, rotation }: { visual: EdgeVisual; rotation?: number }) => {
  const { Icon, color, shouldSpin, isFilled, strokeWidth, isDirectional } = visual

  return (
    <Icon
      size={12}
      strokeWidth={strokeWidth ?? 2}
      fill={isFilled ? 'currentColor' : 'none'}
      className={cn(shouldSpin && 'animate-spin')}
      style={{
        color,
        transform: isDirectional && rotation !== undefined ? `rotate(${rotation}deg)` : undefined,
      }}
    />
  )
}
