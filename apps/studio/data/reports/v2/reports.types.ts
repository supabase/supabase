import { AnalyticsInterval } from 'data/analytics/constants'
import { YAxisProps } from 'recharts'

export interface ReportDataProvider<FiltersType> {
  (
    projectRef: string,
    startDate: string,
    endDate: string,
    interval: AnalyticsInterval,
    filters?: FiltersType
  ): Promise<{
    data: any
    attributes?: {
      attribute: string
      label: string
      color?: { light: string; dark: string }
    }[]
    query?: string // The SQL used to fetch the data if any
  }> // [jordi] would be cool to have a type that forces data keys to match the attributes
}

export interface ReportConfig<FiltersType = any> {
  id: string
  label: string
  dataProvider: ReportDataProvider<FiltersType>
  valuePrecision: number
  hide: boolean
  showTooltip: boolean
  showLegend: boolean
  showMaxValue: boolean
  hideChartType: boolean
  defaultChartStyle: string
  titleTooltip: string
  availableIn: string[]
  format?: (value: unknown) => string
  YAxisProps?: YAxisProps
  xAxisKey?: string
  yAxisKey?: string
}
