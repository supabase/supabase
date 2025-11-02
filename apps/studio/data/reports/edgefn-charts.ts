import { ReportAttributes } from 'components/ui/Charts/ComposedChart.utils'

export const getEdgeFunctionReportAttributes = (): ReportAttributes[] => [
  {
    id: 'execution-status-codes',
    label: 'Edge Function Status Codes',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of edge function executions by status code.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    attributes: [
      {
        attribute: 'ExecutionStatusCodes',
        provider: 'logs',
        label: 'Execution Status Codes',
      },
    ],
  },
  {
    id: 'execution-time',
    label: 'Edge Function Execution Time',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Average execution time for edge functions.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    format: 'ms',
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    attributes: [
      {
        attribute: 'ExecutionTime',
        label: 'Avg. Execution Time (ms)',
        provider: 'logs',
        enabled: true,
      },
    ],
  },
  {
    id: 'invocations-by-region',
    label: 'Edge Function Invocations by Region',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: 'The total number of edge function invocations by region.',
    availableIn: ['pro', 'team', 'enterprise'],
    attributes: [
      {
        attribute: 'InvocationsByRegion',
        provider: 'logs',
        label: 'Invocations by Region',
      },
    ],
  },
]
