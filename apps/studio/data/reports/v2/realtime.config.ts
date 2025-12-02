import type { AnalyticsData, AnalyticsInterval } from 'data/analytics/constants'
import { getInfraMonitoring, InfraMonitoringAttribute } from 'data/analytics/infra-monitoring-query'
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
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  databaseIdentifier?: string
}): ReportConfig[] => [
  {
    id: 'realtime_sum_connections_connected',
    label: 'Connected Clients',
    valuePrecision: 0,
    hide: false,
    showSumAsDefaultHighlight: false,
    showNewBadge: true,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Total number of connected realtime clients.',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_sum_connections_connected',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_sum_connections_connected',
          label: 'Connected Clients',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'broadcast-events',
    label: 'Broadcast Events',
    valuePrecision: 0,
    hide: false,
    showNewBadge: true,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
    dataProvider: async () => {
      const { data } = await runInfraMonitoringQuery(
        projectRef,
        'realtime_channel_events',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const transformedData = data?.map((p) => ({
        ...p,
        realtime_channel_events: Number(p.realtime_channel_events) || 0,
      }))

      const attributes = [
        {
          attribute: 'realtime_channel_events',
          label: 'Events',
        },
      ]

      return { data: transformedData || [], attributes }
    },
  },

  {
    id: 'presence-events',
    label: 'Presence Events',
    valuePrecision: 0,
    hide: false,
    showNewBadge: true,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
    dataProvider: async () => {
      const { data } = await runInfraMonitoringQuery(
        projectRef,
        'realtime_channel_presence_events',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const transformedData = data?.map((p) => ({
        ...p,
        realtime_channel_presence_events: Number(p.realtime_channel_presence_events) || 0,
      }))

      const attributes = [
        {
          attribute: 'realtime_channel_presence_events',
          label: 'Events',
        },
      ]

      return { data: transformedData || [], attributes }
    },
  },

  {
    id: 'db-events',
    label: 'Postgres Changes Events',
    valuePrecision: 0,
    hide: false,
    showNewBadge: true,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'bar',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
    dataProvider: async () => {
      const { data } = await runInfraMonitoringQuery(
        projectRef,
        'realtime_channel_db_events',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const transformedData = data?.map((p) => ({
        ...p,
        realtime_channel_db_events: Number(p.realtime_channel_db_events) || 0,
      }))

      const attributes = [
        {
          attribute: 'realtime_channel_db_events',
          label: 'Events',
        },
      ]

      return { data: transformedData || [], attributes }
    },
  },
  {
    id: 'realtime_rate_of_channel_joins',
    label: 'Rate of Channel Joins',
    valuePrecision: 2,
    hide: false,
    showSumAsDefaultHighlight: false,
    showTooltip: false,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: '',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
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
          label: 'Channel Joins',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_payload_size',
    label: 'Message Payload Size',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showSumAsDefaultHighlight: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'Median size of message payloads sent',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
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
          label: 'Median Payload Size (bytes)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_replication_connection_lag',
    label: 'Broadcast From Database Replication Lag',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showSumAsDefaultHighlight: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip:
      'Median time between database commit and broadcast when using broadcast from database.',
    availableIn: ['pro', 'team', 'enterprise', 'platform'],
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
          label: 'Median Replication Lag (ms)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_read_authorization_rls_execution_time',
    label: '(Read) Private Channel Subscription RLS Execution Time',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showSumAsDefaultHighlight: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip:
      'Execution median time of RLS (Row Level Security) to subscribe to a private channel',
    availableIn: ['pro', 'team', 'enterprise', 'platform'],
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    format: (value: unknown) => `${Number(value).toFixed(2)}ms`,
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_read_authorization_rls_execution_time',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_read_authorization_rls_execution_time',
          label: 'RLS Execution Time (ms)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
  {
    id: 'realtime_write_authorization_rls_execution_time',
    label: '(Write) Private Channel Subscription RLS Execution Time',
    valuePrecision: 2,
    showNewBadge: true,
    hide: false,
    showSumAsDefaultHighlight: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip:
      'Execution median time of RLS (Row Level Security) to publish to a private channel',
    availableIn: ['pro', 'team', 'enterprise', 'platform'],
    YAxisProps: {
      width: 50,
      tickFormatter: (value: number) => `${value}ms`,
    },
    format: (value: unknown) => `${Number(value).toFixed(2)}ms`,
    dataProvider: async () => {
      const data = await runInfraMonitoringQuery(
        projectRef,
        'realtime_write_authorization_rls_execution_time',
        startDate,
        endDate,
        interval,
        databaseIdentifier
      )

      const attributes = [
        {
          attribute: 'realtime_write_authorization_rls_execution_time',
          label: 'RLS Execution Time (ms)',
        },
      ]

      return { data: data?.data || [], attributes }
    },
  },
]
