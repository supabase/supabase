import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export const pricingMetricBytes = [
  PricingMetric.DATABASE_SIZE,
  PricingMetric.EGRESS,
  PricingMetric.STORAGE_SIZE,
]

export const formatUsage = (pricingMetric: PricingMetric, usage: number) => {
  if (pricingMetricBytes.includes(pricingMetric)) {
    return +(usage / 1e9).toFixed(2).toLocaleString()
  } else {
    return usage.toLocaleString()
  }
}

export const billingMetricUnit = (pricingMetric: PricingMetric) => {
  if (pricingMetricBytes.includes(pricingMetric)) {
    return 'GB'
  } else if (pricingMetric.startsWith('COMPUTE_HOURS')) {
    return 'Hours'
  } else {
    return null
  }
}
