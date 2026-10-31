import { YAxisProps } from 'recharts'

import { AnalyticsInterval } from '@/data/analytics/constants'

export type ReportDataProviderAttribute = {
  attribute: string
  label: string
  color?: { light: string; dark: string }
}

export interface ReportDataProvider<FiltersType> {
  (
    projectRef: string,
    startDate: string,
    endDate: string,
    interval: AnalyticsInterval,
    filters?: FiltersType
  ): Promise<{
    data: any
    attributes?: ReportDataProviderAttribute[]
    query?: string // The SQL used to fetch the data if any
  }>
}

export interface ReportConfig<FiltersType = any> {
  id: string
  label: string
  /**
   * dataProvider should handle *fetching* and *transforming* the data to the components.
   * Avoid transforming data inside components.
   * Functions can be extracted to helpers for transforming the data, which will make it easier to test.
   */
  dataProvider: ReportDataProvider<FiltersType>
  valuePrecision: number
  hide: boolean
  hideHighlightedValue?: boolean
  showSumAsDefaultHighlight?: boolean
  showTooltip: boolean
  showLegend: boolean
  showMaxValue: boolean
  hideChartType: boolean
  defaultChartStyle: string
  titleTooltip: string
  /** Set member value to check against the `observability.dashboard_advanced_metrics` set entitlement. If undefined, chart is available to all plans. */
  entitlement?: string
  requiredPlan?: string
  format?: (value: unknown) => string
  YAxisProps?: YAxisProps
  xAxisKey?: string
  yAxisKey?: string
  showNewBadge?: boolean
}
