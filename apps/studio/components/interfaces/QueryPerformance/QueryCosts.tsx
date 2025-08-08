import { cn } from 'ui'

interface QueryCostsProps {
  currentCost?: number
  improvedCost?: number
  improvement?: number
  className?: string
}

export const QueryCosts = ({
  currentCost,
  improvedCost,
  improvement,
  className,
}: QueryCostsProps) => {
  if (!currentCost) return null

  return (
    <div className={cn('flex flex-col gap-y-4', className)}>
      <h3 className="text-sm">Query costs</h3>
      <div className="flex flex-col gap-y-2 rounded bg-surface-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-light">Total cost of query</p>
          <div className="flex flex-col items-end gap-y-1">
            <div className="flex items-center gap-x-4">
              <p className="text-sm text-foreground-light">Currently:</p>
              <p className="font-mono text-sm">
                {typeof currentCost === 'number' && !isNaN(currentCost) && isFinite(currentCost)
                  ? currentCost.toFixed(2)
                  : 'N/A'}
              </p>
            </div>
            {improvedCost &&
              typeof improvedCost === 'number' &&
              !isNaN(improvedCost) &&
              isFinite(improvedCost) && (
                <div className="flex items-center gap-x-4">
                  <p className="text-sm text-foreground-light">With index:</p>
                  <div className="flex items-center gap-x-2">
                    <p className="font-mono text-sm">{improvedCost.toFixed(2)}</p>
                    {improvement &&
                      typeof improvement === 'number' &&
                      !isNaN(improvement) &&
                      isFinite(improvement) && (
                        <p className="text-sm text-brand">↓ {improvement.toFixed(1)}%</p>
                      )}
                  </div>
                </div>
              )}
          </div>
        </div>
        <button className="text-sm text-brand hover:text-brand-600 transition">View more</button>
      </div>
    </div>
  )
}
