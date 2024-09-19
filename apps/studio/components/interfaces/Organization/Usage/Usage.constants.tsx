import { USAGE_APPROACHING_THRESHOLD } from 'components/interfaces/Billing/Billing.constants'
import { EgressType, PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import type { OrgUsageResponse } from 'data/usage/org-usage-query'
import { Alert } from 'ui'

export const COLOR_MAP = {
  white: { bar: 'fill-foreground', marker: 'bg-foreground' },
  green: { bar: 'fill-green-800', marker: 'bg-green-800' },
  'dark-green': { bar: 'fill-green-1000', marker: 'bg-green-1000' },
  blue: { bar: 'fill-blue-900', marker: 'bg-blue-900' },
  yellow: { bar: 'fill-yellow-800', marker: 'bg-yellow-800' },
  'dark-yellow': { bar: 'fill-yellow-1000', marker: 'bg-yellow-1000' },
  orange: { bar: 'fill-orange-800', marker: 'bg-orange-800' },
  'dark-orange': { bar: 'fill-orange-1000', marker: 'bg-orange-1100' },
  red: { bar: 'fill-red-800', marker: 'bg-red-800' },
  'dark-red': { bar: 'fill-red-1000', marker: 'bg-red-1000' },
  purple: { bar: 'fill-purple-900', marker: 'bg-purple-900' },
}

export const USAGE_STATUS = {
  NORMAL: 'NORMAL',
  APPROACHING: 'APPROACHING',
  EXCEEDED: 'EXCEEDED',
}

export type AttributeColor =
  | 'white'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'red'
  | 'dark-red'
  | 'dark-orange'
  | 'dark-yellow'
  | 'dark-green'

export interface Attribute {
  key: string
  name?: string
  color: AttributeColor
}
export interface CategoryAttribute {
  anchor: string
  key: string // Property from organization usage
  attributes: Attribute[] // For querying against stats-daily / infra-monitoring
  name: string
  unit: 'bytes' | 'absolute' | 'percentage' | 'hours' | 'gigabytes'
  links?: {
    name: string
    url: string
  }[]
  description: string
  chartPrefix?: 'Max' | 'Average' | 'Cumulative'
  chartSuffix?: string
  chartDescription: string
  additionalInfo?: (usage?: OrgUsageResponse) => JSX.Element | null
}

export type CategoryMetaKey = 'bandwidth' | 'sizeCount' | 'activity' | 'compute'

export interface CategoryMeta {
  key: CategoryMetaKey
  name: string
  description: string
  attributes: CategoryAttribute[]
}

export const USAGE_CATEGORIES: (subscription?: OrgSubscription) => CategoryMeta[] = (
  subscription
) => [
  {
    key: 'bandwidth',
    name: 'Bandwidth',
    description: 'Amount of data transmitted over all network connections',
    attributes: [
      {
        anchor: 'egress',
        key: PricingMetric.EGRESS,
        attributes: [
          { key: EgressType.AUTH, name: 'Auth Egress', color: 'yellow' },
          { key: EgressType.DATABASE, name: 'Database Egress', color: 'green' },
          { key: EgressType.STORAGE, name: 'Storage Egress', color: 'blue' },
          { key: EgressType.REALTIME, name: 'Realtime Egress', color: 'orange' },
          { key: EgressType.FUNCTIONS, name: 'Functions Egress', color: 'purple' },
          { key: EgressType.SUPAVISOR, name: 'Supavisor Egress', color: 'red' },
        ],
        name: 'Total Egress',
        unit: 'bytes',
        description:
          'Contains any outgoing traffic including Database, Storage, Realtime, Auth, API, Edge Functions, Supavisor and Log Drains.\nBilling is based on the total sum of egress in GB throughout your billing period.',
        chartDescription: 'The data refreshes every 24 hours.',
      },
    ],
  },
  {
    key: 'sizeCount',
    name: 'Database & Storage Size',
    description: 'Amount of resources your project is consuming',
    attributes: [
      {
        anchor: 'dbSize',
        key: PricingMetric.DATABASE_SIZE,
        attributes: [{ key: PricingMetric.DATABASE_SIZE.toLowerCase(), color: 'white' }],
        name: 'Database size',
        chartPrefix: 'Average',
        unit: 'bytes',
        description:
          subscription?.usage_based_billing_project_addons === true
            ? 'Database size refers to the monthly average database space usage, as reported by Postgres. Paid Plans use auto-scaling disks and are billed based on provisioned disk size, rather than database space used.'
            : 'Database size refers to the monthly average database space usage, as reported by Postgres. Paid Plans use auto-scaling disks.\nBilling is based on the average daily database size used in GB throughout the billing period. Billing is independent of the provisioned disk size.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/platform/database-size',
          },
          ...(subscription?.usage_based_billing_project_addons === true
            ? [
                {
                  name: 'Disk Management',
                  url: 'https://supabase.com/docs/guides/platform/database-size#disk-management',
                },
              ]
            : []),
        ],
        chartDescription: 'The data refreshes every 24 hours.',
        additionalInfo: (usage?: OrgUsageResponse) => {
          const usageMeta = usage?.usages.find((x) => x.metric === PricingMetric.DATABASE_SIZE)
          const usageRatio =
            typeof usageMeta !== 'number'
              ? (usageMeta?.usage ?? 0) / (usageMeta?.pricing_free_units ?? 0)
              : 0
          const hasLimit = usageMeta && (usageMeta?.pricing_free_units ?? 0) > 0

          const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
          const isExceededLimit = hasLimit && usageRatio >= 1
          const isCapped = usageMeta?.capped

          const onFreePlan = subscription?.plan?.name === 'Free'

          return (
            <div>
              {(isApproachingLimit || isExceededLimit) && isCapped && (
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
                      mode.{' '}
                      {onFreePlan
                        ? 'Please upgrade your Plan.'
                        : 'Disable your spend cap to scale seamlessly and pay for over-usage beyond your Plans quota.'}
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
        key: PricingMetric.STORAGE_SIZE,
        attributes: [{ key: PricingMetric.STORAGE_SIZE.toLowerCase(), color: 'white' }],
        name: 'Storage Size',
        chartPrefix: 'Average',
        unit: 'bytes',
        description:
          'Sum of all objects in your storage buckets.\nBilling is prorated down to the hour and will be displayed GB-Hrs.',
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Storage',
            url: 'https://supabase.com/docs/guides/storage',
          },
        ],
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
        key: PricingMetric.MONTHLY_ACTIVE_USERS,
        attributes: [{ key: PricingMetric.MONTHLY_ACTIVE_USERS.toLowerCase(), color: 'white' }],
        name: 'Monthly Active Users',
        chartPrefix: 'Cumulative',
        chartSuffix: 'in billing period',
        unit: 'absolute',
        description:
          'Users who log in or refresh their token count towards MAU.\nBilling is based on the sum of distinct users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data is refreshed over a period of 24 hours and resets at the beginning of every billing period.\nThe data points are relative to the beginning of your billing period and will reset with your billing period.',
        links: [
          {
            name: 'Auth',
            url: 'https://supabase.com/docs/guides/auth',
          },
        ],
      },
      {
        anchor: 'mauSso',
        key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
        attributes: [{ key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS.toLowerCase(), color: 'white' }],
        name: 'Monthly Active SSO Users',
        chartPrefix: 'Cumulative',
        chartSuffix: 'in billing period',
        unit: 'absolute',
        description:
          'SSO users who log in or refresh their token count towards SSO MAU.\nBilling is based on the sum of distinct Single Sign-On users requesting your API throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data refreshes over a period of 24 hours and resets at the beginning of every billing period.\nThe data points are relative to the beginning of your billing period and will reset with your billing period.',
        links: [
          {
            name: 'SSO with SAML 2.0',
            url: 'https://supabase.com/docs/guides/auth/sso/auth-sso-saml',
          },
        ],
      },
      {
        anchor: 'storageImageTransformations',
        key: PricingMetric.STORAGE_IMAGES_TRANSFORMED,
        attributes: [
          { key: PricingMetric.STORAGE_IMAGES_TRANSFORMED.toLowerCase(), color: 'white' },
        ],
        name: 'Storage Image Transformations',
        chartPrefix: 'Cumulative',
        chartSuffix: 'in billing period',
        unit: 'absolute',
        description:
          'We count all images that were transformed in the billing period, ignoring any transformations.\nUsage example: You transform one image with four different size transformations and another image with just a single transformation. It counts as two, as only two images were transformed.\nBilling is based on the count of (origin) images that used transformations throughout the billing period. Resets every billing cycle.',
        chartDescription:
          'The data refreshes every 24 hours.\nThe data points are relative to the beginning of your billing period and will reset with your billing period.',
        links: [
          {
            name: 'Documentation',
            url: 'https://supabase.com/docs/guides/storage/image-transformations',
          },
        ],
      },
      {
        anchor: 'funcInvocations',
        key: PricingMetric.FUNCTION_INVOCATIONS,
        attributes: [{ key: PricingMetric.FUNCTION_INVOCATIONS.toLowerCase(), color: 'white' }],
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
        key: PricingMetric.REALTIME_MESSAGE_COUNT,
        attributes: [{ key: PricingMetric.REALTIME_MESSAGE_COUNT.toLowerCase(), color: 'white' }],
        name: 'Realtime Messages',
        unit: 'absolute',
        description:
          "Count of messages going through Realtime. Includes database changes, broadcast and presence. \nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\nBilling is based on the total amount of messages throughout your billing period.",
        chartDescription: 'The data refreshes every 24 hours.',
        links: [
          {
            name: 'Realtime Quotas',
            url: 'https://supabase.com/docs/guides/realtime/quotas',
          },
        ],
      },
      {
        anchor: 'realtimePeakConnections',
        key: PricingMetric.REALTIME_PEAK_CONNECTIONS,
        attributes: [
          { key: PricingMetric.REALTIME_PEAK_CONNECTIONS.toLowerCase(), color: 'white' },
        ],
        name: 'Realtime Peak Connections',
        chartPrefix: 'Max',
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
