import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export const USAGE_APPROACHING_THRESHOLD = 0.8

export interface Metric {
  key: string
  name: string
  units: string
  anchor: string
  category: string
  unitName: string
}

export const BILLING_BREAKDOWN_METRICS: Metric[] = [
  {
    key: PricingMetric.DATABASE_SIZE,
    name: 'Database Size',
    units: 'bytes',
    anchor: 'dbSize',
    category: 'Database',
    unitName: 'GB',
  },
  {
    key: PricingMetric.EGRESS,
    name: 'Egress',
    units: 'bytes',
    anchor: 'egress',
    category: 'Database',
    unitName: 'GB',
  },
  {
    key: PricingMetric.MONTHLY_ACTIVE_USERS,
    name: 'Monthly Active Users',
    units: 'absolute',
    anchor: 'mau',
    category: 'Authentication',
    unitName: 'MAU',
  },
  {
    key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
    name: 'Monthly Active SSO Users',
    units: 'absolute',
    anchor: 'mauSso',
    category: 'Authentication',
    unitName: 'MAU',
  },
  {
    key: PricingMetric.STORAGE_SIZE,
    name: 'Storage Size',
    units: 'bytes',
    anchor: 'storageSize',
    category: 'Storage',
    unitName: 'GB',
  },
  {
    key: PricingMetric.STORAGE_IMAGES_TRANSFORMED,
    name: 'Storage Image Transformations',
    units: 'absolute',
    anchor: 'storageImageTransformations',
    category: 'Storage',
    unitName: 'image',
  },
  {
    key: PricingMetric.REALTIME_PEAK_CONNECTIONS,
    name: 'Realtime Peak Connections',
    units: 'absolute',
    anchor: 'realtimePeakConnections',
    category: 'Realtime',
    unitName: 'connection',
  },
  {
    key: PricingMetric.REALTIME_MESSAGE_COUNT,
    name: 'Realtime Messages',
    units: 'absolute',
    anchor: 'realtimeMessageCount',
    category: 'Realtime',
    unitName: 'message',
  },
  {
    key: PricingMetric.FUNCTION_INVOCATIONS,
    name: 'Edge Function Invocations',
    units: 'absolute',
    anchor: 'funcInvocations',
    category: 'Edge Functions',
    unitName: 'invocation',
  },
  {
    key: PricingMetric.FUNCTION_COUNT,
    name: 'Edge Function Count',
    units: 'absolute',
    anchor: 'funcCount',
    category: 'Edge Functions',
    unitName: 'function',
  },
]
