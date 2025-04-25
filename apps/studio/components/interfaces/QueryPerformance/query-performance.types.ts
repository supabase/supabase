import { HTMLAttributes } from 'react'
import {
  GetIndexAdvisorResultResponse,
  GetIndexAdvisorResultVariables,
} from 'data/database/retrieve-index-advisor-result-query'

// Use the types from data/database instead of duplicating them
export type IndexAdvisorResult = GetIndexAdvisorResultResponse
export type IndexAdvisorConfig = GetIndexAdvisorResultVariables

export interface IndexImprovementTextProps extends HTMLAttributes<HTMLParagraphElement> {
  indexStatements: string[]
  totalCostBefore: number
  totalCostAfter: number
}

export interface IndexSuggestionIconProps {
  indexAdvisorResult: IndexAdvisorResult
  onClickIcon?: () => void
}
