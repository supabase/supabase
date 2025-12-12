import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface CostIndicatorProps {
  cost: number
  /** The maximum cost in the query plan, used to calculate bar width */
  maxCost: number
}

type CostLevel = 'low' | 'moderate' | 'high'

function getCostLevel(cost: number): CostLevel {
  if (cost < 100) return 'low'
  if (cost < 1000) return 'moderate'
  return 'high'
}

function getCostColorClass(level: CostLevel): string {
  switch (level) {
    case 'low':
      return 'bg-brand'
    case 'moderate':
      return 'bg-warning'
    case 'high':
      return 'bg-destructive'
  }
}

function getCostDescription(level: CostLevel): { label: string; description: string } {
  switch (level) {
    case 'low':
      return {
        label: 'Low cost',
        description: 'This operation is efficient and performs well.',
      }
    case 'moderate':
      return {
        label: 'Moderate cost',
        description: 'This operation may benefit from optimization, such as adding an index.',
      }
    case 'high':
      return {
        label: 'High cost',
        description:
          'This operation is expensive and likely needs optimization. Consider adding indexes or restructuring the query.',
      }
  }
}

export function CostIndicator({ cost, maxCost }: CostIndicatorProps) {
  const rawWidth = maxCost > 0 ? (cost / maxCost) * 100 : 0
  const costWidth = Math.min(Math.max(rawWidth, 0), 100)
  const costLevel = getCostLevel(cost)
  const colorClass = getCostColorClass(costLevel)
  const { label, description } = getCostDescription(costLevel)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help">
          <div className="w-16 h-1.5 bg-surface-300 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', colorClass)}
              style={{ width: `${costWidth}%` }}
            />
          </div>
          <span className="text-xs text-foreground-lighter">
            cost <span className="font-mono font-medium">{cost.toFixed(1)}</span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{label}</p>
        <p className="text-foreground-lighter text-xs mt-1">{description}</p>
      </TooltipContent>
    </Tooltip>
  )
}
