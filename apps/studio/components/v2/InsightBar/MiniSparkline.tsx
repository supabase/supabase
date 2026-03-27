'use client'

import { cn } from 'ui'

export function MiniSparkline({
  points,
  color = '#5ba3e6',
  height = 12,
  width = 40,
  className,
}: {
  points: number[]
  color?: string
  height?: number
  width?: number
  className?: string
}) {
  const safePoints = points.length > 0 ? points : [0]
  const max = Math.max(...safePoints)
  const min = Math.min(...safePoints)
  const range = max - min || 1
  const barWidth = Math.max(1, Math.floor(width / safePoints.length) - 1)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <title>Sparkline trend</title>
      {safePoints.map((v, i) => {
        const normalized = (v - min) / range
        const h = Math.max(1, Math.round(normalized * (height - 1)))
        const x = i * (barWidth + 1)
        const y = height - h
        return <rect key={`${i}-${v}`} x={x} y={y} width={barWidth} height={h} rx={1} fill={color} />
      })}
    </svg>
  )
}
