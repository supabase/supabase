export type DataPoint = {
  id?: string
  loopId?: number | string
  period_start: string
  periodStartFormatted?: string
} & {
  // Attribute name will be the key
  [key: string]: string | number
}

export interface AnalyticsData {
  data: DataPoint[]
  format: string
  total: number
  totalAverage: number
  yAxisLimit: number
  hasNoData?: boolean
}
