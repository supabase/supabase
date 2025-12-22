import { useMemo } from 'react'

interface TimelineHeaderProps {
  maxTime: number
  /** Width of the left section containing the node info (operation, cost, etc.) */
  leftSectionWidth: number
}

/**
 * Generates nicely rounded tick values for a timeline
 */
function generateTimelineTicks(maxTime: number, tickCount: number = 10): number[] {
  if (maxTime <= 0) return [0]

  // Calculate a nice step size that produces round numbers
  const rawStep = maxTime / tickCount
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalizedStep = rawStep / magnitude

  let niceStep: number
  if (normalizedStep <= 1) niceStep = magnitude
  else if (normalizedStep <= 2) niceStep = 2 * magnitude
  else if (normalizedStep <= 5) niceStep = 5 * magnitude
  else niceStep = 10 * magnitude

  const ticks: number[] = []
  for (let value = 0; value <= maxTime + niceStep / 2; value += niceStep) {
    ticks.push(value)
    if (ticks.length > tickCount + 1) break
  }

  return ticks
}

function formatTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  if (ms >= 1) {
    return `${ms.toFixed(0)}ms`
  }
  return `${ms.toFixed(2)}ms`
}

export function TimelineHeader({ maxTime, leftSectionWidth }: TimelineHeaderProps) {
  const ticks = useMemo(() => generateTimelineTicks(maxTime), [maxTime])

  return (
    <div className="flex items-end border-b border-border-muted bg-studio sticky top-0 z-10">
      {/* Empty space for the left section alignment */}
      <div style={{ width: leftSectionWidth }} className="shrink-0" />

      {/* Timeline ticks */}
      <div className="flex-1 flex items-end justify-between px-4 relative">
        {ticks.map((tick, idx) => {
          const position = maxTime > 0 ? (tick / maxTime) * 100 : 0
          return (
            <div
              key={idx}
              className="flex flex-col items-center"
              style={{
                position: 'absolute',
                left: `${position}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-xs text-foreground-lighter font-mono whitespace-nowrap">
                {formatTime(tick)}
              </span>
              <div className="w-px h-1.5 bg-border-muted" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

