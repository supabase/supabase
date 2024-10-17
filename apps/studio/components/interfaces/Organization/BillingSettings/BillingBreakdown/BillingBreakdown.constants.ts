import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export const USAGE_APPROACHING_THRESHOLD = 0.8

export interface Metric {
  key: string
  name: string
  units: string
  anchor?: string
  category: string
  unitName?: string
  tip?: string
  docLink?: {
    title: string
    url: string
  }
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
    key: PricingMetric.MONTHLY_ACTIVE_THIRD_PARTY_USERS,
    name: 'Monthly Active Third-Party Users',
    units: 'absolute',
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
  },
  {
    key: PricingMetric.REALTIME_PEAK_CONNECTIONS,
    name: 'Realtime Peak Connections',
    units: 'absolute',
    anchor: 'realtimePeakConnections',
    category: 'Realtime',
  },
  {
    key: PricingMetric.REALTIME_MESSAGE_COUNT,
    name: 'Realtime Messages',
    units: 'absolute',
    anchor: 'realtimeMessageCount',
    category: 'Realtime',
  },
  {
    key: PricingMetric.FUNCTION_INVOCATIONS,
    name: 'Edge Function Invocations',
    units: 'absolute',
    anchor: 'funcInvocations',
    category: 'Edge Functions',
  },
  {
    key: PricingMetric.DISK_SIZE_GB_HOURS_GP3,
    name: 'Disk Size',
    anchor: 'diskSize',
    units: 'absolute',
    unitName: 'GB-Hrs',
    category: 'Database',
    tip: 'Each project gets provisioned with 8 GB of GP3 disk for free. When you get close to the disk size limit, we autoscale your disk by 1.5x. Each GB of provisioned disk size beyond 8 GB incurs a GB-Hr every hour. Each extra GB is billed at $0.125/month ($0.000171/GB-Hr), prorated down to the hour.',
    docLink: {
      title: 'Read more',
      url: 'https://supabase.com/docs/guides/platform/org-based-billing#disk-size',
    },
  },
  {
    key: PricingMetric.DISK_SIZE_GB_HOURS_IO2,
    name: 'Disk Size IO2',
    anchor: 'diskSize',
    units: 'absolute',
    unitName: 'GB-Hrs',
    category: 'Database',
  },
  {
    key: PricingMetric.DISK_IOPS_IO2,
    name: 'Disk IOPS IO2',
    units: 'absolute',
    unitName: 'IOPS-Hrs',
    category: 'Database',
  },
  {
    key: PricingMetric.DISK_IOPS_GP3,
    name: 'Disk IOPS GP3',
    units: 'absolute',
    unitName: 'IOPS-Hrs',
    category: 'Database',
  },
  {
    key: PricingMetric.DISK_THROUGHPUT_GP3,
    name: 'Disk Throughput',
    units: 'absolute',
    unitName: 'IOPS-Hrs',
    category: 'Database',
  },
  {
    key: PricingMetric.LOG_DRAIN_EVENTS,
    name: 'Log Drain Events',
    units: 'absolute',
    category: 'Database',
  },
]
