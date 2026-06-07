import { ReactNode } from 'react'
import { Admonition } from 'ui-patterns'

import { USAGE_APPROACHING_THRESHOLD } from '@/components/interfaces/Billing/Billing.constants'
import { EgressType, PricingMetric } from '@/data/analytics/org-daily-stats-query'
import type { OrgSubscription } from '@/data/subscriptions/types'
import type { OrgUsageResponse } from '@/data/usage/org-usage-query'
import { DOCS_URL } from '@/lib/constants'

export const COLOR_MAP = {
  white: { bar: 'fill-foreground', marker: 'bg-foreground' },
  green: { bar: 'fill-green-800', marker: 'bg-green-800' },
  'dark-green': { bar: 'fill-green-1000', marker: 'bg-green-1000' },
  blue: { bar: 'fill-blue-900', marker: 'bg-blue-900' },
  yellow: { bar: 'fill-yellow-800', marker: 'bg-yellow-800' },
  'dark-yellow': { bar: 'fill-yellow-1000', marker: 'bg-yellow-1000' },
  orange: { bar: 'fill-orange-800', marker: 'bg-orange-800' },
  'dark-orange': { bar: 'fill-orange-1000', marker: 'bg-orange-1100' },
  teal: { bar: 'fill-teal-600', marker: 'bg-teal-700' },
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
  | 'teal'

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
  additionalInfo?: (usage?: OrgUsageResponse) => ReactNode | null
}

export type CategoryMetaKey = 'egress' | 'sizeCount' | 'activity' | 'compute' | 'logs'

export interface CategoryMeta {
  key: CategoryMetaKey
  name: string
  description: string
  attributes: CategoryAttribute[]
}

export const USAGE_CATEGORIES: (subscription?: OrgSubscription) => CategoryMeta[] = (
  subscription
) => {
  const egressAttributes: CategoryAttribute[] = [
    {
      anchor: 'egress',
      key: PricingMetric.EGRESS,
      attributes: [
        { key: EgressType.AUTH, name: 'Auth Egress', color: 'yellow' },
        { key: EgressType.REST, name: 'PostgREST Egress', color: 'green' },
        { key: EgressType.STORAGE, name: 'Storage Egress', color: 'blue' },
        { key: EgressType.REALTIME, name: 'Realtime Egress', color: 'orange' },
        { key: EgressType.FUNCTIONS, name: 'Functions Egress', color: 'purple' },
        { key: EgressType.SUPAVISOR, name: 'Shared Pooler Egress', color: 'red' },
        { key: EgressType.LOGDRAIN, name: 'Logdrain Egress', color: 'teal' },
      ],
      name: 'Egress',
      unit: 'bytes',
      description:
        'Contains any outgoing traffic including Database, Storage, Realtime, Auth, API, Edge Functions, Pooler and Log Drains.\n',
      chartDescription:
        'The breakdown of different egress types is inclusive of cached egress. The data refreshes every hour.',
      links: [
        {
          name: 'Documentation',
          url: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,
        },
      ],
    },
    {
      anchor: 'cachedEgress',
      key: PricingMetric.CACHED_EGRESS,
      attributes: [{ key: PricingMetric.CACHED_EGRESS.toLowerCase(), color: 'white' }],
      name: 'Cached Egress',
      unit: 'bytes',
      description:
        'Contains any outgoing traffic that is served from a cache hit.\n',
      chartDescription: 'The data refreshes every hour.',
      links: [
        {
          name: 'Documentation',
          url: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,
        },
      ],
    },
  ]

  const databaseAndStorageSizeAttributes: CategoryAttribute[] = []
  if (subscription?.plan.id === 'free') {
    databaseAndStorageSizeAttributes.push({
      anchor: 'dbSize',
      key: PricingMetric.DATABASE_SIZE,
      attributes: [{ key: PricingMetric.DATABASE_SIZE.toLowerCase(), color: 'white' }],
      name: 'Database size',
      chartPrefix: 'Average',
      unit: 'bytes',
      description:
        'Database size refers to the actual amount of space used by all your database objects, as reported by Postgres.',
      links: [
        {
          name: 'Documentation',
          url: `${DOCS_URL}/guides/platform/database-size`,
        },
      ],
      chartDescription: 'The data refreshes every hour.',
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
              <Admonition
                type={isExceededLimit ? 'danger' : 'warning'}
                title={
                  isExceededLimit ? 'Exceeding database size limit' : 'Nearing database size limit'
                }
              >
                <div className="flex w-full items-center flex-col justify-center space-y-2 md:flex-row md:justify-between">
                  <div>
                    When you reach your database size limit, your project can go into read-only
                    mode.{' '}
                    {onFreePlan
                      ? 'Please upgrade your Plan.'
                      : "Disable your spend cap to scale seamlessly, and pay for over-usage beyond your Plan's quota."}
                  </div>
                </div>
              </Admonition>
            )}
          </div>
        )
      },
    })
  } else if (subscription?.plan.id !== 'platform') {
    databaseAndStorageSizeAttributes.push({
      anchor: 'diskSize',
      key: 'diskSize',
      attributes: [],
      name: 'Disk size',
      chartPrefix: 'Average',
      unit: 'bytes',
      description:
        "Each Supabase project comes with a dedicated disk. Each project gets a dedicated disk that scales automatically as your data grows.\n",
      links: [
        {
          name: 'Documentation',
          url: `${DOCS_URL}/guides/platform/manage-your-usage/disk-size`,
        },
        {
          name: 'Disk Management',
          url: `${DOCS_URL}/guides/platform/database-size#disk-management`,
        },
      ],
      chartDescription: '',
    })
  } else if (subscription?.plan.id === 'platform') {
    databaseAndStorageSizeAttributes.push({
      anchor: 'databaseSize',
      key: PricingMetric.DATABASE_SIZE,
      attributes: [{ key: PricingMetric.DATABASE_SIZE.toLowerCase(), color: 'white' }],
      name: 'Database Size',
      chartPrefix: 'Cumulative',
      unit: 'bytes',
      description:
        'Database size refers to the actual amount of space used by all your database objects, as reported by Postgres.',
      chartDescription: 'The data refreshes every hour.',
    })
  }

  databaseAndStorageSizeAttributes.push({
    anchor: 'storageSize',
    key: PricingMetric.STORAGE_SIZE,
    attributes: [{ key: PricingMetric.STORAGE_SIZE.toLowerCase(), color: 'white' }],
    name: 'Storage Size',
    chartPrefix: 'Average',
    unit: 'bytes',
    description:
      'Sum of all objects in your storage buckets.',
    chartDescription: 'The data refreshes every hour.',
    links: [
      {
        name: 'Storage',
        url: `${DOCS_URL}/guides/storage`,
      },
    ],
  })

  return [
    {
      key: 'egress',
      name: 'Egress',
      description: 'Amount of data transmitted over all network connections',
      attributes: egressAttributes,
    },
    {
      key: 'sizeCount',
      name: 'Database & Storage Size',
      description: 'Amount of resources your project is consuming',
      attributes: databaseAndStorageSizeAttributes,
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
          chartSuffix: 'in period',
          unit: 'absolute',
          description:
            'Users who log in or refresh their token count towards MAU.\n',
          chartDescription:
            'The data is refreshed over a period of 24 hours.',
          links: [
            {
              name: 'Auth',
              url: `${DOCS_URL}/guides/auth`,
            },
          ],
        },
        {
          anchor: 'mauSso',
          key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
          attributes: [
            { key: PricingMetric.MONTHLY_ACTIVE_SSO_USERS.toLowerCase(), color: 'white' },
          ],
          name: 'Monthly Active SSO Users',
          chartPrefix: 'Cumulative',
          chartSuffix: 'in period',
          unit: 'absolute',
          description:
            'SSO users who log in or refresh their token count towards SSO MAU.\n',
          chartDescription:
            'The data refreshes over a period of 24 hours.',
          links: [
            {
              name: 'SSO with SAML 2.0',
              url: `${DOCS_URL}/guides/auth/sso/auth-sso-saml`,
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
          chartSuffix: 'in period',
          unit: 'absolute',
          description:
            'We count all images that were transformed in the selected period.\nUsage example: You transform one image with four different size transformations and another image with just a single transformation. It counts as two, as only two images were transformed.\n',
          chartDescription:
            'The data refreshes every 24 hours.',
          links: [
            {
              name: 'Documentation',
              url: `${DOCS_URL}/guides/storage/image-transformations`,
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
            'Every serverless function invocation independent of response status is counted.\n',
          chartDescription: 'The data refreshes every hour.',
          links: [
            {
              name: 'Edge Functions',
              url: `${DOCS_URL}/guides/functions`,
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
            "Count of messages going through Realtime. Includes database changes, broadcast and presence. \nUsage example: If you do a database change and 5 clients listen to that change via Realtime, that's 5 messages. If you broadcast a message and 4 clients listen to that, that's 5 messages (1 message sent, 4 received).\n",
          chartDescription: 'The data refreshes every hour.',
          links: [
            {
              name: 'Realtime Limits',
              url: `${DOCS_URL}/guides/realtime/limits`,
            },
          ],
        },
        {
          anchor: 'realtimePeakConnections',
          key: PricingMetric.REALTIME_PEAK_CONNECTIONS,
          attributes: [
            { key: PricingMetric.REALTIME_PEAK_CONNECTIONS.toLowerCase(), color: 'white' },
          ],
          name: 'Realtime Concurrent Peak Connections',
          chartPrefix: 'Max',
          unit: 'absolute',
          description:
            'Total number of successful connections. Connections attempts are not counted towards usage.\n',
          chartDescription: 'The data refreshes every hour.',
          links: [
            {
              name: 'Realtime Limits',
              url: `${DOCS_URL}/guides/realtime/limits`,
            },
          ],
        },
      ],
    },

    {
      key: 'logs',
      name: 'Logs',
      description: 'Usage statistics related to your logs',
      attributes: [
        {
          anchor: 'logIngestion',
          key: PricingMetric.LOG_INGESTION,
          attributes: [{ key: PricingMetric.LOG_INGESTION.toLowerCase(), color: 'white' }],
          name: 'Log Ingestion',
          unit: 'absolute',
          description:
            'Total amount of logs ingested across all projects.\n',
          chartDescription: 'The data refreshes every hour.',
          links: [],
        },
        {
          anchor: 'logQuery',
          key: PricingMetric.LOG_QUERYING,
          attributes: [{ key: PricingMetric.LOG_QUERYING.toLowerCase(), color: 'white' }],
          name: 'Log Query',
          unit: 'absolute',
          description:
            'Total amount of logs queried across all projects.\n',
          chartDescription: 'The data refreshes every hour.',
          links: [],
        },
        {
          anchor: 'logStorage',
          key: PricingMetric.LOG_STORAGE,
          attributes: [{ key: PricingMetric.LOG_STORAGE.toLowerCase(), color: 'white' }],
          name: 'Log Storage',
          unit: 'absolute',
          description:
            'Total amount of logs stored on the platform.\n',
          chartDescription: 'The data refreshes every hour.',
          links: [],
        },
      ],
    },
  ]
}
