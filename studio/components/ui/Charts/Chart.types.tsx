export type HeaderType<Datum> = {
  attribute: string
  focus: number | null
  format?: string
  highlightedValue?: number
  data?: Datum[]
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
