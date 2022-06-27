import { CategoricalChartState } from "recharts/types/chart/generateCategoricalChart"

export type  BarChartProps = {
  data?: DataPoint[],
  attribute: string,
  yAxisLimit: number | string | undefined,
  format?: string,
  highlightedValue?: string | number,
  customDateFormat?: string,
  displayDateInUtc: boolean ,
  label: string,
  onBarClick?: (v: CategoricalChartState) => void,
  minimalHeader?: boolean,
  chartSize?: string,
  className?: string,
  noDataTitle?: string,
  noDataMessage?: string,
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