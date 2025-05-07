import { HTMLAttributes } from 'react'

import { cn } from 'ui'
import { calculateImprovement } from './index-advisor.utils'

interface IndexImprovementTextProps extends HTMLAttributes<HTMLParagraphElement> {
  indexStatements: string[]
  totalCostBefore: number
  totalCostAfter: number
}

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
