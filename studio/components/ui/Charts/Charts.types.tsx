export interface CommonChartProps {
  title?: string
  minimalHeader?: boolean
  highlightedValue?: number
}

export type HeaderType<D> = {
  attribute: string
  focus: number | null
  format?: string
  highlightedValue?: number
  data?: D[]
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
