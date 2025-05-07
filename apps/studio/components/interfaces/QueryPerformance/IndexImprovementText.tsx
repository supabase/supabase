import { cn } from 'ui'
import { calculateImprovement } from './index-advisor.utils'
import { IndexImprovementTextProps } from './query-performance.types'

export const IndexImprovementText = ({
  indexStatements,
  totalCostBefore,
  totalCostAfter,
  className,
  ...props
}: IndexImprovementTextProps) => {
  const improvement = calculateImprovement(totalCostBefore, totalCostAfter)

  return (
    <p className={cn('text-sm text-foreground-light', className)} {...props}>
      Query's performance can be improved by{' '}
      <span className="text-brand">{improvement.toFixed(2)}%</span> by creating this{' '}
      {indexStatements.length > 1 ? 'indexes' : 'index'}:
    </p>
  )
}
