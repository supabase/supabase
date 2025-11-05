export interface CommonChartProps<D>
  extends Pick<
    HeaderType<D>,
    | 'highlightedValue'
    | 'highlightedLabel'
    | 'customDateFormat'
    | 'data'
    | 'format'
    | 'minimalHeader'
    | 'displayDateInUtc'
  > {
  title?: string
  className?: string
  valuePrecision?: number
  size?: 'tiny' | 'small' | 'normal' | 'large'
}

export interface StackedChartProps<D> extends CommonChartProps<D> {
  xAxisKey: string
  xAxisFormatAsDate?: boolean
  dateFormat?: string
  yAxisKey: string
  stackKey: string
}

export type HeaderType<D> = {
  attribute: string
  focus: number | null
  format?: string | ((value: unknown) => string)
  highlightedValue?: number | string
  highlightedLabel?: string
  data: D[]
  customDateFormat?: string
  label: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
}

export type Datum = Record<string, string | number>

export interface TimeseriesDatum extends Datum {
  timestamp: string
}

export interface ChartData {
  format: string
  yAxisLimit?: number
  maximum?: number
  total: number
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
