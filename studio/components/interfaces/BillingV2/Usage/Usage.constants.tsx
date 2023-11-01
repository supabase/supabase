import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import { ProjectUsageData } from 'data/usage/project-usage-query'
import Link from 'next/link'
import { Alert, Badge, Button, IconExternalLink } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'

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
    ref: string,
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
        key: 'max_cpu_usage',
        attribute: 'max_cpu_usage',
        name: 'CPU',
        unit: 'percentage',
        description: 'Max CPU usage of your server',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
          { name: 'High CPU Usage', url: 'https://supabase.com/docs/guides/platform/exhaust-cpu' },
          {
            name: 'Metrics',
            url: 'https://supabase.com/docs/guides/platform/metrics',
          },
        ],
      },
      {
        anchor: 'ram',
        key: 'ram_usage',
        attribute: 'ram_usage',
        name: 'Memory',
        unit: 'percentage',
        description:
          'Memory usage of your server.\nYou might observe elevated memory usage, even with little to no load. Besides Postgres, a wide range of services is running under the hood resulting in an elevated base memory usage.',
        chartDescription: '',
        links: [
          {
            name: 'Compute Add-Ons',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons',
          },
          { name: 'High RAM Usage', url: 'https://supabase.com/docs/guides/platform/exhaust-ram' },
          {
            name: 'Metrics',
            url: 'https://supabase.com/docs/guides/platform/metrics',
          },
        ],
      },
      {
        anchor: 'disk_io',
        key: 'disk_io_consumption',
        attribute: 'disk_io_consumption',
        name: 'Disk IO Bandwidth',
        unit: 'percentage',
        links: [
          {
            name: 'Disk Throughput and IOPS',
            url: 'https://supabase.com/docs/guides/platform/compute-add-ons#disk-throughput-and-iops',
          },
          {
            name: 'Metrics',
            url: 'https://supabase.com/docs/guides/platform/metrics',
          },
        ],
        description:
          'The disk performance of your workload is determined by the Disk IO bandwidth.\nSmaller compute instances (below 4XL) can burst up to their largest throughput and IOPS for 30 minutes in a day. Beyond that, the performance reverts to the baseline. Your disk budget gets replenished throughout the day.',
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
        name: 'Database Egress',
        unit: 'bytes',
        description:
          'Contains any outgoing traffic (egress) from your database.\nBilling is based on the total sum of egress in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
      {
        anchor: 'storageEgress',
        key: 'storage_egress',
        attribute: 'total_storage_egress',
        name: 'Storage Egress',
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
          'Database size refers to the monthly average storage usage, as reported by Postgres. Paid plans use auto-scaling disks.\nBilling is based on the average daily database size used in GB throughout the billing period. Billing is independent of the provisioned disk size.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/database-size',
          },
        ],
        chartDescription: 'The data refreshes every 24 hours.',
        additionalInfo: (
          ref: string,
          subscription?: ProjectSubscriptionResponse,
          usage?: ProjectUsageData
        ) => {
          const usageMeta = usage?.['db_size'] ?? undefined
          const usageRatio =
            typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
          const hasLimit = usageMeta && usageMeta.limit > 0

          const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
          const isExceededLimit = hasLimit && usageRatio >= 1

          return subscription?.plan?.id !== 'free' ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-sm">Disk size:</p>
                  <p className="text-sm">{usage?.disk_volume_size_gb} GB</p>
                  <Badge color="green" size="small">
                    Auto-scaling
                  </Badge>
                </div>
                <Button asChild size="tiny" type="default" icon={<IconExternalLink size={14} />}>
                  <Link href="https://supabase.com/docs/guides/platform/database-usage#disk-management">
                    What is disk size?
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-foreground-light mt-3">
                If you reach 95% of the disk space, your project will enter read-only mode. Your
                disk storage expands automatically when the database reaches 90% of the disk size.
                The disk is expanded to be 50% larger. Auto-scaling can only take place once every 6
                hours. You can also{' '}
                <Link
                  href={`/project/${ref}/settings/database#diskManagement`}
                  className="text-brand transition hover:text-brand-600"
                >
                  preprovision
                </Link>{' '}
                disk for loading larger amounts of data.
              </p>
            </div>
          ) : (
            <div>
              {(isApproachingLimit || isExceededLimit) && (
                <Alert
                  withIcon
                  variant={isExceededLimit ? 'danger' : 'warning'}
                  title={
                    isExceededLimit
                      ? 'Exceeding database size limit'
                      : 'Nearing database size limit'
                  }
                >
                  <div className="flex w-full items-center flex-col justify-center space-y-2 md:flex-row md:justify-between">
                    <div>
                      When you reach your database size limit, your project can go into read-only
                      mode. Please upgrade your plan.
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )
        },
      },
      {
        anchor: 'storageSize',
        key: 'storage_size',
        attribute: 'total_storage_size_bytes',
        name: 'Storage Size',
        chartPrefix: 'Average ',
        unit: 'bytes',
        description:
          'Sum of all objects in your storage buckets.\nBilling is based on the average daily size in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Storage',
            url: 'https://supabase.com/docs/guides/storage',
          },
        ],
      },
      {
        anchor: 'funcCount',
        key: 'func_count',
        attribute: 'total_func_count',
        name: 'Edge Function Count',
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
        links: [
          {
            name: 'Auth',
            url: 'https://supabase.com/docs/guides/auth',
          },
        ],
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
        links: [
          {
            name: 'SSO with SAML 2.0',
            url: 'https://supabase.com/docs/guides/auth/sso/auth-sso-saml',
          },
        ],
      },
      {
        anchor: 'storageImageTransformations',
        key: 'storage_image_render_count',
        attribute: 'total_storage_image_render_count',
        name: 'Storage Image Transformations',
        unit: 'absolute',
        description:
          'We count all images that were transformed in the billing period, ignoring any transformations.\nUsage example: You transform one image with four different size transformations and another image with just a single transformation. It counts as two, as only two images were transformed.\nBilling is based on the count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data refreshes every 24 hours.\nThe data points are relative to the beginning of your billing period.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/storage/serving/image-transformations',
          },
        ],
      },
      {
        anchor: 'functionInvocations',
        key: 'func_invocations',
        attribute: 'total_func_invocations',
        name: 'Edge Function Invocations',
        unit: 'absolute',
        description:
          'Every serverless function invocation independent of response status is counted.\nBilling is based on the sum of all invocations throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Edge Functions',
            url: 'https://supabase.com/docs/guides/functions',
          },
        ],
      },
      {
        anchor: 'realtimeMessageCount',
        key: 'realtime_message_count',
        attribute: 'total_realtime_message_count',
        name: 'Realtime Message Count',
        unit: 'absolute',
        description:
          "Count of messages going through Realtime.\nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Realtime Quotas',
            url: 'https://supabase.com/docs/guides/realtime/quotas',
          },
        ],
      },
      {
        anchor: 'realtimePeakConnection',
        key: 'realtime_peak_connection',
        attribute: 'total_realtime_peak_connection',
        name: 'Realtime Peak Connections',
        chartPrefix: 'Max ',
        unit: 'absolute',
        description:
          'Total number of successful connections. Connections attempts are not counted towards usage.\nBilling is based on the maximum amount of concurrent peak connections throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Realtime Quotas',
            url: 'https://supabase.com/docs/guides/realtime/quotas',
          },
        ],
      },
    ],
  },
]
