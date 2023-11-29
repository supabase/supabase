import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export const USAGE_APPROACHING_THRESHOLD = 0.8

export interface Metric {
  key: string
  name: string
  units: string
  anchor: string
  // metric?: string
  category: string
  unitName: string
}

export const BILLING_BREAKDOWN_METRICS: Metric[] = [
  {
    key: PricingMetric.DATABASE_SIZE,
    name: 'Database space',
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
    name: 'Active users',
    units: 'absolute',
    anchor: 'mau',
    // metric: 'MONTHLY_ACTIVE_USERS',
    category: 'Authentication',
    unitName: 'MAU',
  },
  {
    key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
    name: 'Active SSO users',
    units: 'absolute',
    anchor: 'mauSso',
    // metric: 'MONTHLY_ACTIVE_SSO_USERS',
    category: 'Authentication',
    unitName: 'MAU',
  },
  {
    key: PricingMetric.STORAGE_SIZE,
    name: 'Storage space',
    units: 'bytes',
    anchor: 'storageSize',
    // metric: 'STORAGE_SIZE',
    category: 'Storage',
    unitName: 'GB',
  },
  {
    key: PricingMetric.STORAGE_IMAGES_TRANSFORMED,
    name: 'Storage Image Transformations',
    units: 'absolute',
    anchor: 'storageImageTransformations',
    // metric: 'STORAGE_IMAGES_TRANSFORMED',
    category: 'Storage',
    unitName: 'image',
  },
  {
    key: PricingMetric.REALTIME_PEAK_CONNECTIONS,
    name: 'Realtime peak connections',
    units: 'absolute',
    anchor: 'realtimePeakConnections',
    // metric: 'REALTIME_PEAK_CONNECTIONS',
    category: 'Realtime',
    unitName: 'connection',
  },
  {
    key: PricingMetric.REALTIME_MESSAGE_COUNT,
    name: 'Realtime messages',
    units: 'absolute',
    anchor: 'realtimeMessageCount',
    // metric: 'REALTIME_MESSAGE_COUNT',
    category: 'Realtime',
    unitName: 'message',
  },
  {
    key: PricingMetric.FUNCTION_INVOCATIONS,
    name: 'Edge Function invocations',
    units: 'absolute',
    anchor: 'funcInvocations',
    // metric: 'FUNCTION_INVOCATIONS',
    category: 'Edge Functions',
    unitName: 'invocation',
  },
  {
    key: PricingMetric.FUNCTION_COUNT,
    name: 'Edge Functions',
    units: 'absolute',
    anchor: 'funcCount',
    // metric: 'FUNCTION_COUNT',
    category: 'Edge Functions',
    unitName: 'function',
  },
]
