export interface CommonChartProps<D>
  extends Pick<
    HeaderType<D>,
    | 'highlightedValue'
    | 'customDateFormat'
    | 'data'
    | 'format'
    | 'minimalHeader'
    | 'displayDateInUtc'
  > {
  title?: string
}

export type HeaderType<D> = {
  attribute: string
  focus: number | null
  format?: string
  highlightedValue?: number | string
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
