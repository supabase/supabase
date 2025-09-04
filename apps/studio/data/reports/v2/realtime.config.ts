import { getInfraMonitoring, InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
import type { AnalyticsInterval, AnalyticsData } from 'data/analytics/constants'
import { ReportConfig } from './reports.types'

async function runInfraMonitoringQuery(
  projectRef: string,
  attribute: InfraMonitoringAttribute,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier?: string
): Promise<AnalyticsData> {
  const data = await getInfraMonitoring({
    projectRef,
    attribute,
    startDate,
    endDate,
    interval,
    databaseIdentifier,
  })

  return data
}

export const realtimeReports = ({
  projectRef,
  startDate,
  endDate,
  interval,
  databaseIdentifier,
  isFreePlan,
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  databaseIdentifier?: string
  isFreePlan: boolean
}): ReportConfig[] => [
  {
    id: 'client-to-realtime-connections',
    label: 'Realtime connections',
    valuePrecision: 2,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_connections_connected',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_connections_connected',
          label: 'Connections',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'channel-events',
    label: 'Channel Events',
    valuePrecision: 2,
    hide: false,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const [channelEvents, dbEvents, presenceEvents] = await Promise.all([
        runInfraMonitoringQuery(
          projectRef,
          'realtime_channel_events',
          startDate,
          endDate,
          interval,
          databaseIdentifier
        ),
        runInfraMonitoringQuery(
          projectRef,
          'realtime_channel_db_events',
          startDate,
          endDate,
          interval,
          databaseIdentifier
        ),
        runInfraMonitoringQuery(
          projectRef,
          'realtime_channel_presence_events',
          startDate,
          endDate,
          interval,
          databaseIdentifier
        ),
      ])

      // Combine the data from all three queries
      const combinedData = new Map()

      // Process channel events
      channelEvents?.data?.forEach((point: any) => {
        const key = point.period_start
        if (!combinedData.has(key)) {
          combinedData.set(key, { timestamp: point.period_start })
        }
        combinedData.get(key).realtime_channel_events = point.realtime_channel_events
      })

      // Process DB events
      dbEvents?.data?.forEach((point: any) => {
        const key = point.period_start
        if (!combinedData.has(key)) {
          combinedData.set(key, { timestamp: point.period_start })
        }
        combinedData.get(key).realtime_channel_db_events = point.realtime_channel_db_events
      })

      // Process presence events
      presenceEvents?.data?.forEach((point: any) => {
        const key = point.period_start
        if (!combinedData.has(key)) {
          combinedData.set(key, { timestamp: point.period_start })
        }
        combinedData.get(key).realtime_channel_presence_events =
          point.realtime_channel_presence_events
      })

      const data = Array.from(combinedData.values()).sort((a, b) => a.timestamp - b.timestamp)

      const attributes = [
        {
          attribute: 'realtime_channel_events',
          label: 'Broadcast',
        },
        {
          attribute: 'realtime_channel_db_events',
          label: 'Postgres Changes',
        },
        {
          attribute: 'realtime_channel_presence_events',
          label: 'Presence',
        },
      ]

      return { data, attributes }
    },
  },
  {
    id: 'realtime_rate_of_channel_joins',
    label: 'Rate of Channel Joins',
    valuePrecision: 2,
    hide: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_channel_joins',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_channel_joins',
          label: 'Presence',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_authorization_rls_execution_time',
    label: 'Realtime Authorization RLS Execution Time',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Execution time of RLS (Row Level Security) checks for realtime authorization.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    format: (value: unknown) => `${Number(value).toFixed(2)}ms`,
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_authorization_rls_execution_time',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_authorization_rls_execution_time',
          label: 'RLS Execution Time (ms)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_payload_size',
    label: 'Realtime Broadcast Payload Size',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Size of broadcast payloads sent through realtime.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}B`,
    },
    format: (value: unknown) => `${Number(value).toFixed(2)}B`,
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_payload_size',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_payload_size',
          label: 'Payload Size (bytes)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_connected_clients',
    label: 'Realtime Connected Clients',
    valuePrecision: 0,
    hide: false,
    showNewBadge: true,
    showTooltip: true,
    showLegend: false,
    showMaxValue: true,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Total number of connected realtime clients.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_connected_clients',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_connected_clients',
          label: 'Connected Clients',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_replication_connection_lag',
    label: 'Realtime Replication Connection Lag',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Time between database commit and broadcast when using broadcast from database.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    format: (value: unknown) => `${Number(value).toFixed(2)}ms`,
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_replication_connection_lag',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_replication_connection_lag',
          label: 'Replication Lag (ms)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
]
