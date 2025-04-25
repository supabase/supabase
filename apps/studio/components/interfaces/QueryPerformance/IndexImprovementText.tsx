import React from 'react'
import { calculateImprovement } from './index-advisor.utils'
import { cn } from 'ui'
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
      Creating the following {indexStatements.length > 1 ? 'indexes' : 'index'} can improve this
      query's performance by <span className="text-brand">{improvement.toFixed(2)}%</span>:
    </p>
  )
}
