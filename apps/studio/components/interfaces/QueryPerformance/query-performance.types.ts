import { HTMLAttributes } from 'react'
import { IndexAdvisorResult } from 'lib/database/index-advisor'

export interface IndexImprovementTextProps extends HTMLAttributes<HTMLParagraphElement> {
  indexStatements: string[]
  totalCostBefore: number
  totalCostAfter: number
}

export interface IndexSuggestionIconProps {
  indexAdvisorResult: IndexAdvisorResult
  onClickIcon?: () => void
}
