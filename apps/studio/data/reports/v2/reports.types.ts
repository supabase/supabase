import { AnalyticsInterval } from 'data/analytics/constants'
import { YAxisProps } from 'recharts'

type ReportDataProviderFilter = {
  functionIds?: string[]
}

export interface ReportDataProvider {
  (
    projectRef: string,
    startDate: string,
    endDate: string,
    interval: AnalyticsInterval,
    functionIds?: string[],
    edgeFnIdToName?: (id: string) => string | undefined,
    filters?: ReportDataProviderFilter[]
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

export interface ReportConfig {
  id: string
  label: string
  dataProvider: ReportDataProvider
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
