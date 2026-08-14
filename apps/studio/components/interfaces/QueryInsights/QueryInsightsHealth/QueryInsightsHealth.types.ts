import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'

export type IssueType = 'error' | 'index' | 'slow' | null

export type HealthLevel = 'healthy' | 'warning' | 'critical'

export interface ClassifiedQuery extends QueryPerformanceRow {
  issueType: IssueType
  hint: string
  queryType: string | null
}
