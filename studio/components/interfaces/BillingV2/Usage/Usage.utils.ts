import { DataPoint } from 'data/analytics/constants'
import { ProjectUsageResponse } from 'data/usage/project-usage-query'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import { CategoryAttribute, USAGE_STATUS } from './Usage.constants'
import { StripeSubscription } from 'components/interfaces/Billing'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'

// [Joshen] This is just for development to generate some test data for chart rendering
export const generateUsageData = (attribute: string, days: number): DataPoint[] => {
  const tempArray = new Array(days).fill(0)
  return tempArray.map((x, idx) => {
    return {
      loopId: (idx + 1).toString(),
      period_start: `${idx + 1}`,
      [attribute]: Math.floor(Math.random() * 100).toString(),
    }
  })
}

export const getUsageStatus = (attributes: CategoryAttribute[], usage?: ProjectUsageResponse) => {
  if (!usage) return USAGE_STATUS.NORMAL

  const attributeStatuses = attributes.map((attribute) => {
    const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse]
    const usageRatio =
      typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
    if (usageRatio >= 1) return USAGE_STATUS.EXCEEDED
    else if (usageRatio >= USAGE_APPROACHING_THRESHOLD) return USAGE_STATUS.APPROACHING
    else return USAGE_STATUS.NORMAL
  })

  if (attributeStatuses.find((x) => x === USAGE_STATUS.EXCEEDED)) return USAGE_STATUS.EXCEEDED
  else if (attributeStatuses.find((x) => x === USAGE_STATUS.APPROACHING))
    return USAGE_STATUS.APPROACHING
  else return USAGE_STATUS.NORMAL
}

export const getUpgradeUrl = (projectRef: string, subscription?: StripeSubscription) => {
  if (!subscription) return `/project/${projectRef}/settings/billing/update`

  return subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
    ? `/project/${projectRef}/settings/billing/update/enterprise`
    : subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
    ? `/project/${projectRef}/settings/billing/update/team`
    : subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.FREE
    ? `/project/${projectRef}/settings/billing/update`
    : `/project/${projectRef}/settings/billing/update/pro`
}

export const getUpgradeUrlFromV2Subscription = (
  projectRef: string,
  subscription?: ProjectSubscriptionResponse,
  newSubscriptionPage?: boolean
) => {
  if (!subscription) {
    return !newSubscriptionPage
      ? `/project/${projectRef}/settings/billing/update`
      : `/project/${projectRef}/settings/billing/subscription`
  }

  if (!newSubscriptionPage) {
    return subscription?.plan.id === 'enterprise'
      ? `/project/${projectRef}/settings/billing/update/enterprise`
      : subscription?.plan.id === 'team'
      ? `/project/${projectRef}/settings/billing/update/team`
      : subscription?.plan.id === 'free'
      ? `/project/${projectRef}/settings/billing/update`
      : `/project/${projectRef}/settings/billing/update/pro`
  } else {
    return subscription?.plan?.id === 'pro' && subscription?.usage_billing_enabled === false
      ? `/project/${projectRef}/settings/billing/subscription#cost-control`
      : `/project/${projectRef}/settings/billing/subscription?panel=subscriptionPlan`
  }
}

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
})

export const ChartYFormatterCompactNumber = (number: number | string, unit: string) => {
  if (typeof number === 'string') return number

  if (unit === 'bytes') {
    const formattedBytes = formatBytes(number, 0).replace(/\s/g, '')

    return formattedBytes === '0bytes' ? '0' : formattedBytes
  } else {
    return compactNumberFormatter.format(number)
  }
}
