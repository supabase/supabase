export interface ChartData {
  format: string
  yAxisLimit?: number
  maximum?: number
  total: number
  totalAverage: number
  totalGrouped: Attribute
  data: DataPoint[]
}

type DataPoint = Timestamp | Attribute

interface Timestamp {
  // ISO formatted
  period_start: string
  // unix timestamp (ms)
  timestamp: number
}

interface Attribute {
  [attribute: string]: number
}
