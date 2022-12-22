import { AreaProps } from 'recharts'

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
  isLoading?: boolean
  size?: 'small' | 'normal' | 'large'
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
  format?: string
  highlightedValue?: number | string
  highlightedLabel?: string
  data: D[]
  customDateFormat?: string
  label: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
}

export interface Datum {
  [attribute: string]: number | string
}

export interface TimeseriesDatum extends Datum {
  timestamp: string
}
