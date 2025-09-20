import { useContext, useMemo } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { PlanNodeData } from './types'
import { HeatmapContext } from './contexts'

const Bar = ({ pct, heatColor }: { pct: number; heatColor: string }) => (
  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: heatColor }} />
)

export const Heatmap = ({ data }: { data: PlanNodeData }) => {
  const heat = useContext(HeatmapContext)

  // Heatmap progress bar (time/rows/cost)
  const valueForHeat = useMemo(() => {
    switch (heat.mode) {
      case 'time':
        return (data.exclusiveTimeMs ?? 0) || (data.actualTotalTime ?? 0) * (data.actualLoops ?? 1)
      case 'rows': {
        const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
        return actualTotal || (data.planRows ?? 0)
      }
      case 'cost':
        return data.exclusiveCost ?? 0
      default:
        return 0
    }
  }, [
    heat.mode,
    data.exclusiveTimeMs,
    data.actualTotalTime,
    data.actualLoops,
    data.actualRows,
    data.planRows,
    data.exclusiveCost,
  ])

  const maxForHeat =
    heat.mode === 'time'
      ? heat.maxTime
      : heat.mode === 'rows'
        ? heat.maxRows
        : heat.mode === 'cost'
          ? heat.maxCost
          : 1
  const pct = Math.max(0, Math.min(100, Math.round((valueForHeat / (maxForHeat || 1)) * 100)))
  const heatColor = useMemo(() => {
    if (heat.mode === 'none') return 'transparent'
    const hue = 120 - pct * 1.2 // 120->0 (green->red)
    return `hsl(${hue}, 85%, 45%)`
  }, [heat.mode, pct])

  const tooltipText = useMemo(() => {
    if (heat.mode === 'time') return `time (self): ${valueForHeat.toFixed(2)} ms`
    if (heat.mode === 'rows') return `rows: ${valueForHeat}`
    if (heat.mode === 'cost') return `self cost: ${valueForHeat.toFixed(2)}`
    return null
  }, [heat.mode, valueForHeat])

  return (
    <div className="h-[3px] w-full bg-surface-100">
      {tooltipText ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Bar pct={pct} heatColor={heatColor} />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Bar pct={pct} heatColor={heatColor} />
      )}
    </div>
  )
}
