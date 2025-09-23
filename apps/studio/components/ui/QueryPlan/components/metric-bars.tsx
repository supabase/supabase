import { cn } from 'ui'

type MetricBarProps = {
  percent: number
  secondaryPercent?: number
  color?: string
  secondaryColor?: string
}

/**
 * Mirrors SparkBar styling
 */
export const MetricBar = ({
  percent,
  secondaryPercent = 0,
  color = 'bg-foreground',
  secondaryColor = 'bg-foreground-muted',
}: MetricBarProps) => {
  const primaryWidth = Math.max(Math.min(percent, 100), 0)
  const secondaryWidth = Math.max(Math.min(secondaryPercent, 100 - primaryWidth), 0)

  return (
    <div className="relative flex h-1 w-full overflow-hidden rounded bg-surface-400 border border-transparent">
      <div
        className={cn(
          'h-full rounded-l transition-[width] duration-300',
          color,
          secondaryWidth <= 0 && 'rounded-r'
        )}
        style={{ width: `${primaryWidth}%` }}
      />
      {secondaryWidth > 0 && (
        <div
          className={cn(
            'h-full rounded-r transition-[width] duration-300 opacity-80',
            secondaryColor
          )}
          style={{ width: `${secondaryWidth}%` }}
        />
      )}
    </div>
  )
}

export type SegmentedBarSegment = {
  id: string
  percent: number
  color: string
}

type SegmentedBarProps = {
  segments: SegmentedBarSegment[]
}

export const SegmentedBar = ({ segments }: SegmentedBarProps) => {
  let remaining = 100
  const normalizedSegments: (SegmentedBarSegment & { width: number })[] = []

  segments.forEach((segment) => {
    const width = Math.max(Math.min(segment.percent, remaining), 0)
    remaining = Math.max(remaining - width, 0)

    if (width > 0) {
      normalizedSegments.push({ ...segment, width })
    }
  })

  return (
    <div className="relative flex h-1 w-full overflow-hidden rounded bg-surface-400 border border-transparent">
      {normalizedSegments.map((segment, idx) => (
        <div
          key={segment.id}
          className={cn(
            'h-full transition-[width] duration-300',
            segment.color,
            idx === 0 && 'rounded-l',
            idx === normalizedSegments.length - 1 && 'rounded-r'
          )}
          style={{ width: `${segment.width}%` }}
        />
      ))}
    </div>
  )
}
