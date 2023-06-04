import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import { ProjectUsageData } from 'data/usage/project-usage-query'
import Link from 'next/link'
import { Badge, Button, IconExternalLink } from 'ui'

export const Y_DOMAIN_CEILING_MULTIPLIER = 4 / 3

export const USAGE_STATUS = {
  NORMAL: 'NORMAL',
  APPROACHING: 'APPROACHING',
  EXCEEDED: 'EXCEEDED',
}

export interface CategoryAttribute {
  anchor: string
  key: string // Property from project usage
  attribute: string // For querying against stats-daily / infra-monitoring
  name: string
  chartPrefix?: string
  unit: 'bytes' | 'absolute' | 'percentage'
  links?: {
    name: string
    url: string
  }[]
  description: string
  chartDescription: string
  additionalInfo?: (
    subscription?: ProjectSubscriptionResponse,
    usage?: ProjectUsageData
  ) => JSX.Element | null
}

export type CategoryMetaKey = 'infra' | 'bandwidth' | 'sizeCount' | 'activity'

export interface CategoryMeta {
  key: 'infra' | 'bandwidth' | 'sizeCount' | 'activity'
  name: string
  description: string
  attributes: CategoryAttribute[]
}

export const USAGE_CATEGORIES: CategoryMeta[] = [
  {
    key: 'infra',
    name: 'Infrastructure',
    description: 'Usage statistics related to your server instance',
    attributes: [
      {
        anchor: 'cpu',
        key: 'cpu_usage',
        attribute: 'cpu_usage',
        name: 'CPU',
        unit: 'percentage',
        description: 'CPU usage of your server',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
          { name: 'High CPU Usage', url: 'https://supabase.com/docs/guides/platform/exhaust-cpu' },
        ],
      },
      {
        anchor: 'ram',
        key: 'ram_usage',
        attribute: 'ram_usage',
        name: 'Memory',
        unit: 'percentage',
        description: 'Memory usage of your server',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
        ],
      },
      {
        anchor: 'disk_io',
        key: 'disk_io_consumption',
        attribute: 'disk_io_consumption',
        name: 'Disk IO bandwidth',
        unit: 'percentage',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons#disk-throughput-and-iops',
          },
        ],
        description:
          'Smaller compute instances (below 4XL) can burst up to their largest throughput and IOPS for 30 minutes in a day. Beyond that, the performance reverts to the baseline. Your disk budget gets replenished throughout the day.',
        chartDescription: '',
      },
    ],
  },
  {
    key: 'bandwidth',
    name: 'Bandwidth',
    description: 'Amount of data transmitted over all network connections',
    attributes: [
      {
        anchor: 'dbEgress',
        key: 'db_egress',
        attribute: 'total_egress_modified',
        name: 'Database egress',
        unit: 'bytes',
        description:
          'Contains any outgoing traffic (egress) from your database.\nBilling is based on the total sum of egress in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
      {
        anchor: 'storageEgress',
        key: 'storage_egress',
        attribute: 'total_storage_egress',
        name: 'Storage egress',
        unit: 'bytes',
        description:
          'All requests to view and download your storage items go through our CDN. We sum up all outgoing traffic (egress) for storage related requests through our CDN. We do not differentiate between cache and no cache hits.\nBilling is based on the total amount of egress in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
    ],
  },
  {
    key: 'sizeCount',
    name: 'Size & Counts',
    description: 'Amount of resources your project is consuming',
    attributes: [
      {
        anchor: 'dbSize',
        key: 'db_size',
        attribute: 'total_db_size_bytes',
        name: 'Database size',
        chartPrefix: 'Average ',
        unit: 'bytes',
        description:
          'Billing is based on the average daily database size in GB throughout the billing period.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/database-size',
          },
        ],
        chartDescription: 'The data refreshes every 24 hours.',
        additionalInfo: (subscription?: ProjectSubscriptionResponse, usage?: ProjectUsageData) =>
          subscription?.plan?.id !== 'free' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm">Disk size:</p>
                <p className="text-sm">{usage?.disk_volume_size_gb} GB</p>
                <Badge color="green" size="small">
                  Auto-scaling
                </Badge>
              </div>
              <Link href="https://supabase.com/docs/guides/platform/database-usage#disk-management">
                <a>
                  <Button size="tiny" type="default" icon={<IconExternalLink size={14} />}>
                    What is disk size?
                  </Button>
                </a>
              </Link>
            </div>
          ) : null,
      },
      {
        anchor: 'storageSize',
        key: 'storage_size',
        attribute: 'total_storage_size_bytes',
        name: 'Storage size',
        chartPrefix: 'Max ',
        unit: 'bytes',
        description:
          'Sum of all objects in your storage buckets.\nBilling is based on the average size in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
      {
        anchor: 'funcCount',
        key: 'func_count',
        attribute: 'total_func_count',
        name: 'Edge function count',
        chartPrefix: 'Max ',
        unit: 'absolute',
        description:
          'Number of serverless functions in your project.\nBilling is based on the maximum amount of functions at any point in time throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
    ],
  },
  {
    key: 'activity',
    name: 'Activity',
    description: 'Usage statistics that reflect the activity of your project',
    attributes: [
      {
        anchor: 'mau',
        key: 'monthly_active_users',
        attribute: 'total_auth_billing_period_mau',
        name: 'Monthly Active Users',
        unit: 'absolute',
        description:
          'Users who log in or refresh their token count towards MAU.\nBilling is based on the sum of distinct users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data is refreshed over a period of 24 hours and resets at the beginning of every billing period.\nThe data points are relative to the beginning of your billing period.',
      },
      {
        anchor: 'mauSso',
        key: 'monthly_active_sso_users',
        attribute: 'total_auth_billing_period_sso_mau',
        name: 'Monthly Active SSO Users',
        unit: 'absolute',
        description:
          'SSO users who log in or refresh their token count towards SSO MAU.\nBilling is based on the sum of distinct Single Sign-On users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data refreshes over a period of 24 hours and resets at the beginning of every billing period.\nThe data points are relative to the beginning of your billing period.',
      },
      {
        anchor: 'storageImageTransformations',
        key: 'storage_image_render_count',
        attribute: 'total_storage_image_render_count',
        name: 'Storage image transformations',
        unit: 'absolute',
        description:
          'We count all images that were transformed in the billing period, ignoring any transformations.\nUsage example: You transform one image with four different size transformations and another image with just a single transformations. It counts as two, as only two images were transformed.\nBilling is based on the count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data refreshes every 24 hours.\nThe data points are relative to the beginning of your billing period.',
      },
      {
        anchor: 'functionInvocations',
        key: 'func_invocations',
        attribute: 'total_func_invocations',
        name: 'Edge function invocations',
        unit: 'absolute',
        description:
          'Every serverless function invocation independent of response status is counted.\nBilling is based on the sum of all invocations throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
      {
        anchor: 'realtimeMessageCount',
        key: 'realtime_message_count',
        attribute: 'total_realtime_message_count',
        name: 'Realtime message count',
        unit: 'absolute',
        description:
          "Count of messages going through Realtime.\nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
        chartDescription: 'The data refreshes every 24 hours.',
      },
      {
        anchor: 'realtimePeakConnection',
        key: 'realtime_peak_connection',
        attribute: 'total_realtime_peak_connection',
        name: 'Realtime peak connections',
        chartPrefix: 'Max ',
        unit: 'absolute',
        description:
          'Total number of successful connections (not connection attempts).\nBilling is based on the maximum amount of concurrent peak connections throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
    ],
  },
]

// [Joshen] Ideally live in common package for www as well
export const COMPUTE_INSTANCE_SPECS: {
  [key: string]: { maxBandwidth: number; baseBandwidth: number; memoryGb: number; cpuCores: number }
} = {
  addon_instance_micro: {
    memoryGb: 1,
    cpuCores: 2,
    maxBandwidth: 2085,
    baseBandwidth: 87,
  },
  addon_instance_small: {
    memoryGb: 2,
    cpuCores: 2,
    maxBandwidth: 2085,
    baseBandwidth: 174,
  },
  addon_instance_medium: {
    memoryGb: 4,
    cpuCores: 2,
    maxBandwidth: 2085,
    baseBandwidth: 347,
  },
  addon_instance_large: {
    memoryGb: 8,
    cpuCores: 2,
    maxBandwidth: 4750,
    baseBandwidth: 630,
  },
  addon_instance_xlarge: {
    memoryGb: 16,
    cpuCores: 4,
    maxBandwidth: 4750,
    baseBandwidth: 1188,
  },
  addon_instance_xxlarge: {
    memoryGb: 32,
    cpuCores: 8,
    maxBandwidth: 4750,
    baseBandwidth: 2375,
  },
  addon_instance_4xlarge: {
    memoryGb: 64,
    cpuCores: 16,
    maxBandwidth: 4750,
    baseBandwidth: 4750,
  },
  addon_instance_8xlarge: {
    memoryGb: 128,
    cpuCores: 32,
    maxBandwidth: 9500,
    baseBandwidth: 9500,
  },
  addon_instance_12xlarge: {
    memoryGb: 192,
    cpuCores: 48,
    maxBandwidth: 14250,
    baseBandwidth: 14250,
  },
  addon_instance_16xlarge: {
    memoryGb: 256,
    cpuCores: 64,
    maxBandwidth: 19000,
    baseBandwidth: 19000,
  },
}
