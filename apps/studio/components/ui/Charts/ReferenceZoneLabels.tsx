import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'

import { getReferenceZoneLabelPositions } from './ReferenceZoneLabels.utils'

type ReferenceZoneLabel = {
  label: string
  color: string
  tooltip: string
  value: number
}

type ReferenceZoneLabelsProps = {
  labels: ReferenceZoneLabel[]
  onInteract?: () => void
  offset?: { left: number; top: number; width: number; height: number }
  yAxisMap?: Record<string, { scale: (value: number) => number }>
}

export const ReferenceZoneLabels = ({
  labels,
  offset,
  yAxisMap,
  onInteract,
}: ReferenceZoneLabelsProps) => {
  const scale = yAxisMap?.[0]?.scale
  if (!offset || !scale || labels.length === 0 || offset.width <= 8 || offset.height < 20)
    return null

  const labelHeight = 20
  const labelWidth = Math.min(136, Math.max(0, offset.width - 8))
  const labelX = offset.left + offset.width - labelWidth - 4
  const targetPositions = labels.map((label) => scale(label.value))
  const positions = getReferenceZoneLabelPositions(
    targetPositions,
    offset.top + labelHeight / 2,
    offset.top + offset.height - labelHeight / 2
  )

  return (
    <TooltipProvider delayDuration={400}>
      <g>
        {labels.map((label, index) => (
          <g key={label.label}>
            {positions[index] !== targetPositions[index] && (
              <path
                d={`M ${Math.max(offset.left, labelX - 12)} ${targetPositions[index]} H ${Math.max(offset.left, labelX - 6)} V ${positions[index]} H ${labelX}`}
                fill="none"
                stroke={label.color}
                strokeOpacity={0.6}
                strokeWidth={1}
              />
            )}
            <foreignObject
              x={labelX}
              y={positions[index] - labelHeight / 2}
              width={labelWidth}
              height={labelHeight}
              onMouseEnter={onInteract}
              onMouseMove={(event) => event.stopPropagation()}
            >
              <div className="flex min-w-0 justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      tabIndex={0}
                      className="min-w-0 max-w-full truncate rounded-sm bg-default px-1.5 py-0.5 text-xs leading-4 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      style={{ color: label.color }}
                      onFocus={onInteract}
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      {label.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top">
                    {label.tooltip}
                  </TooltipContent>
                </Tooltip>
              </div>
            </foreignObject>
          </g>
        ))}
      </g>
    </TooltipProvider>
  )
}
