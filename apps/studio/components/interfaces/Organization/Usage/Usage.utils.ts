import dayjs from 'dayjs'
import { groupBy } from 'lodash'

import { DataPoint } from 'data/analytics/constants'
import type { OrgDailyUsageResponse, PricingMetric } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'

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

export const getUpgradeUrl = (slug: string, subscription?: OrgSubscription, source?: string) => {
  if (!subscription) {
    return `/org/${slug}/billing`
  }

  return subscription?.plan?.id === 'pro' && subscription?.usage_billing_enabled === false
    ? `/org/${slug}/billing#cost-control`
    : `/org/${slug}/billing?panel=subscriptionPlan&source=usage${source}`
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
  } else if (unit === 'gigabytes') {
    return compactNumberFormatter.format(number) + 'GB'
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
  } else if (unit === 'gigabytes') {
    return compactNumberFormatter.format(number) + 'GB'
  } else {
    return compactNumberFormatter.format(number)
  }
}

const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

const formatBytesCompact = (bytes: number) => {
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

const formatBytesPrecision = (bytes: any) => {
  if (bytes === 0 || bytes === undefined) return '0 bytes'

  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const unit = sizes[i]

  return parseFloat((bytes / Math.pow(k, i)).toFixed(3)) + ' ' + unit
}

export function dailyUsageToDataPoints(
  dailyUsage: OrgDailyUsageResponse | undefined,
  includeMetric: (metric: PricingMetric) => boolean
): DataPoint[] {
  if (!dailyUsage || !dailyUsage.usages.length) return []

  const groupedByDate = groupBy(
    dailyUsage.usages.filter((it) => includeMetric(it.metric as PricingMetric)),
    'date'
  )

  const dataPoints: DataPoint[] = []

  Object.entries(groupedByDate).forEach(([date, usages]) => {
    const dataPoint: DataPoint = {
      period_start: date,
      periodStartFormatted: dayjs(date).format('DD MMM'),
    }

    for (const usage of usages) {
      dataPoint[usage.metric.toLowerCase()] = usage.usage_original

      if (usage.breakdown) {
        for (const [key, value] of Object.entries(usage.breakdown)) {
          dataPoint[key.toLowerCase()] = value
        }
      }
    }

    dataPoints.push(dataPoint)
  })

  return dataPoints
}
