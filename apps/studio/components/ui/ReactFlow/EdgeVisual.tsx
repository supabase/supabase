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
  strokeWidth: number
  shouldAnimate: boolean
  shouldSpin?: boolean
  isFilled?: boolean
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
      strokeWidth: 2,
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
      strokeWidth: 2,
      shouldAnimate: true,
    }
  }
  return {
    Icon: Square,
    color: 'var(--foreground-lighter)',
    opacity: 0.5,
    dashArray: '5 5',
    strokeWidth: 2,
    shouldAnimate: false,
    isFilled: true,
  }
}

/** The round icon chip rendered mid-edge, bordered in the edge's color. */
export const EdgeVisualChip = ({ visual }: { visual: EdgeVisual }) => {
  const { Icon, color, shouldSpin, isFilled } = visual

  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center border bg-surface-100"
      style={{ borderColor: color }}
    >
      <Icon
        size={14}
        className={cn(shouldSpin && 'motion-safe:animate-spin')}
        style={{ color, fill: isFilled ? color : undefined }}
      />
    </div>
  )
}
