export type  AreaChartProps = {
  data?: DataPoint[],
  attribute: string,
  yAxisLimit: number | string | undefined,
  format?: string,
  highlightedValue?: number,
  customDateFormat?: string,
  label: string,
}

export type HeaderType = {
  attribute: string,
  focus: number | null,
  format?: string,
  highlightedValue?: number,
  data?: DataPoint[],
  customDateFormat?: string,
  label: string,
  minimalHeader?: boolean,
  displayDateInUtc?: boolean,
}


export type DataPoint = {
  [attribute: string]: number
}
