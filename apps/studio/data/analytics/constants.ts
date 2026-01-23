export type DataPoint = {
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
  yAxisLimit: number
  hasNoData?: boolean
}

export type AnalyticsInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d'
