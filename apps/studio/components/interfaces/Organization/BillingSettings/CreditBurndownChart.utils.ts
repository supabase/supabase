import dayjs from 'dayjs'

import type { OrgCreditsBurndownData } from '@/data/subscriptions/org-credits-burndown-query'

export type BurndownAggregation = 'day' | 'week'

type BurndownApiEntry = NonNullable<OrgCreditsBurndownData>['data'][number]

export interface BurndownBreakdownItem {
  key: string
  label: string
  amount: number
}

export interface BurndownDataPoint {
  timestamp: string
  balance: number
  breakdown: BurndownBreakdownItem[]
}

// Below this many days in the selected range, the chart buckets by day;
// at or above it, it buckets by week to keep the chart readable.
const WEEKLY_AGGREGATION_THRESHOLD_DAYS = 30

// Date range pickers can't select anything before this.
export const getBurndownMinDate = () => dayjs().subtract(3, 'month').startOf('day').toDate()

export const getDefaultBurndownRange = () => ({
  from: dayjs().startOf('month').startOf('day').toDate(),
  to: dayjs().startOf('day').toDate(),
})

export const deriveBurndownAggregation = (from: Date, to: Date): BurndownAggregation => {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1
  return days < WEEKLY_AGGREGATION_THRESHOLD_DAYS ? 'day' : 'week'
}

const formatBreakdownLabel = (item: string) =>
  item
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Maps the raw API response (cents, one entry per day) into the dollar-based
 * shape the chart works with, dropping zero-amount breakdown items. Amounts
 * are signed: negative amounts are credits consumed, positive amounts are
 * credits added (e.g. top-ups).
 */
export const mapBurndownResponse = (entries: BurndownApiEntry[]): BurndownDataPoint[] => {
  return entries.map((entry) => ({
    timestamp: dayjs(entry.day).toISOString(),
    balance: entry.ending_balance_cents / 100,
    breakdown: entry.breakdown
      .filter((item) => item.amount_cents !== 0)
      .map((item) => ({
        key: item.item,
        label: formatBreakdownLabel(item.item),
        amount: item.amount_cents / 100,
      })),
  }))
}

const getBucketKey = (date: dayjs.Dayjs, aggregation: BurndownAggregation) => {
  return aggregation === 'day'
    ? date.format('YYYY-MM-DD')
    : date.startOf('week').format('YYYY-MM-DD')
}

const sumBreakdownItems = (breakdowns: BurndownBreakdownItem[][]): BurndownBreakdownItem[] => {
  const totals = new Map<string, BurndownBreakdownItem>()

  breakdowns.forEach((breakdown) => {
    breakdown.forEach((item) => {
      const existing = totals.get(item.key)
      totals.set(item.key, {
        key: item.key,
        label: item.label,
        amount: Math.round(((existing?.amount ?? 0) + item.amount) * 100) / 100,
      })
    })
  })

  return Array.from(totals.values())
}

/**
 * Buckets daily data points by the given aggregation. Each bucket keeps the
 * latest balance in the bucket (the burndown line always reflects the most
 * recent value) and sums the breakdown amounts consumed within the bucket.
 */
export const aggregateBurndownData = (
  data: BurndownDataPoint[],
  aggregation: BurndownAggregation
): BurndownDataPoint[] => {
  if (aggregation === 'day') return data

  const buckets = new Map<string, BurndownDataPoint[]>()

  data.forEach((point) => {
    const key = getBucketKey(dayjs(point.timestamp), aggregation)
    const bucket = buckets.get(key) ?? []
    bucket.push(point)
    buckets.set(key, bucket)
  })

  return Array.from(buckets.values()).map((bucket) => {
    const latest = bucket[bucket.length - 1]

    return {
      timestamp: latest.timestamp,
      balance: latest.balance,
      breakdown: sumBreakdownItems(bucket.map((point) => point.breakdown)),
    }
  })
}

/**
 * Sums each breakdown category's consumption across the entire dataset,
 * regardless of the aggregation used to render the chart.
 */
export const getBurndownBreakdownTotals = (data: BurndownDataPoint[]): BurndownBreakdownItem[] => {
  return sumBreakdownItems(data.map((point) => point.breakdown))
}

export const formatBurndownCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Compact form (e.g. $12.3K, $1.2M) for space-constrained labels like the
// chart's Y axis, which can't fit a fully expanded currency value.
export const formatBurndownCurrencyCompact = (amount: number) => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
}

// Explicit +/- sign for breakdown amounts, since negative (credits consumed)
// and positive (credits added) both need to read unambiguously at a glance.
export const formatBurndownCurrencySigned = (amount: number) => {
  const formatted = formatBurndownCurrency(Math.abs(amount))
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}
