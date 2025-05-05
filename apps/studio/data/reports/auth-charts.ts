export const getAuthReportAttributes = (isFreePlan: boolean) => [
  {
    id: 'client-connections',
    label: 'Active Users',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    attributes: [
      {
        attribute: 'pg_stat_database_num_backends',
        provider: 'infra-monitoring',
        label: 'active connections',
        tooltip: 'Active connections',
      },
    ],
  },
]
