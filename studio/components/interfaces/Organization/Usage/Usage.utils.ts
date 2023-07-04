import { DataPoint } from 'data/analytics/constants'
import { ProjectUsageResponse } from 'data/usage/project-usage-query'
import { USAGE_APPROACHING_THRESHOLD } from 'components/interfaces/BillingV2/Billing.constants'
import { CategoryAttribute, USAGE_STATUS } from './Usage.constants'
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

export const getUpgradeUrl = (slug: string, subscription?: ProjectSubscriptionResponse) => {
  if (!subscription) {
    return `/org/${slug}/billing`
  }

  return subscription?.plan?.id === 'pro' && subscription?.usage_billing_enabled === false
    ? `/org/${slug}/billing#cost-control`
    : `/org/${slug}/billing?panel=subscriptionPlan`
}

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
})

/**
 * For the y-axis, we don't need to be as precise, to avoid showing 58.597MB.
 */
export const ChartYFormatterCompactNumber = (number: number | string, unit: string) => {
  if (typeof number === 'string') return number

  if (unit === 'bytes') {
    const formattedBytes = formatBytesCompact(number).replace(/\s/g, '')

    return formattedBytes === '0bytes' ? '0' : formattedBytes
  } else {
    return compactNumberFormatter.format(number)
  }
}

/**
 * For the chart tooltip, we want to be more precise and show more decimals.
 */
export const ChartTooltipValueFormatter = (number: number | string, unit: string) => {
  if (typeof number === 'string') return number

  if (unit === 'bytes') {
    const formattedBytes = formatBytesPrecision(number).replace(/\s/g, '')

    return formattedBytes === '0bytes' ? '0' : formattedBytes
  } else {
    return compactNumberFormatter.format(number)
  }
}

const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

export const formatBytesCompact = (bytes: number) => {
  if (bytes === 0 || bytes === undefined) return '0 bytes'

  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const unit = sizes[i]

  let dm = 2
  if (['bytes', 'KB', 'MB'].includes(unit)) {
    dm = 0
  } else if (['GB'].includes(unit)) {
    dm = 1
  }

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + unit
}

export const formatBytesPrecision = (bytes: any) => {
  if (bytes === 0 || bytes === undefined) return '0 bytes'

  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const unit = sizes[i]

  return parseFloat((bytes / Math.pow(k, i)).toFixed(3)) + ' ' + unit
}
