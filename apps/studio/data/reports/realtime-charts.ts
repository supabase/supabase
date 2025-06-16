export const getRealtimeReportAttributes = (isFreePlan: boolean) => [
  {
    id: 'realtime-connections-per-tenant',
    label: 'Events per second',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      { attribute: 'realtime_events_presence', provider: 'infra-monitoring', label: 'Presence' },
      {
        attribute: 'realtime_postgres_changes_total_subscriptions',
        provider: 'infra-monitoring',
        label: 'Postgres Changes',
      },
      {
        attribute: 'realtime_events_broadcast',
        provider: 'infra-monitoring',
        label: 'Broadcast',
      },
    ],
  },
  {
    id: 'realtime_rate_of_channel_joins',
    label: 'Rate of Channel Joins',
    valuePrecision: 0,
    hide: false,
    showTooltip: false,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    attributes: [
      {
        attribute: 'realtime_rate_of_channel_joins',
        provider: 'infra-monitoring',
        label: 'Presence',
      },
    ],
  },
  {
    id: 'client-to-realtime-connections',
    label: 'Client to Realtime connections',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: '',
    attributes: [
      {
        attribute: 'realtime_connections',
        provider: 'infra-monitoring',
        label: 'Connections',
        enabled: true,
      },
    ],
  },
]
