import { PricingMetric } from 'data/analytics/org-daily-stats-query'

const pricingMetricBytes = [
  PricingMetric.DATABASE_SIZE,
  PricingMetric.EGRESS,
  PricingMetric.STORAGE_SIZE,
]

export const formatUsage = (
  pricingMetric: PricingMetric,
  allocation: { usage: number; hours?: number }
) => {
  if (allocation.hours) {
    return (
      allocation.usage.toLocaleString() +
      ' (' +
      Math.round(allocation.usage / allocation.hours).toLocaleString() +
      'x' +
      allocation.hours.toLocaleString() +
      ' hours)'
    )
  }

  if (pricingMetricBytes.includes(pricingMetric)) {
    const formattedUsage = +(allocation.usage / 1e9).toFixed(2).toLocaleString()

    // To avoid very low usage displaying as "0", we will show "<0.01" instead
    if (allocation.usage > 0 && formattedUsage === 0) {
      return '<0.01'
    } else {
      return formattedUsage
    }
  } else {
    return allocation.usage.toLocaleString()
  }
}

export const billingMetricUnit = (pricingMetric: PricingMetric) => {
  if (pricingMetricBytes.includes(pricingMetric)) {
    return 'GB'
  } else if (
    pricingMetric.startsWith('COMPUTE_HOURS') ||
    [
      PricingMetric.CUSTOM_DOMAIN,
      PricingMetric.IPV4,
      PricingMetric.PITR_7,
      PricingMetric.PITR_14,
      PricingMetric.PITR_28,
    ].includes(pricingMetric)
  ) {
    return 'Hours'
  } else {
    return null
  }
}

export const generateUpgradeReasons = (originalPlan?: string, upgradedPlan?: string) => {
  const reasons = [
    'Current plan limits are not enough for me',
    'I want better customer support from Supabase',
    'I am migrating from a previous project',
  ]

  if (originalPlan === undefined || upgradedPlan === undefined) {
    reasons.push('None of the above')
    return reasons
  }

  if (originalPlan === 'free' && upgradedPlan === 'pro') {
    reasons.push('Need more compute')
    reasons.push(
      'I want access to additional features like branching, daily backups, custom domain and PITR'
    )
  } else if (upgradedPlan === 'team') {
    reasons.push('I want access to SOC2 and HIPAA compliance')
  }

  reasons.push('None of the above')

  return reasons
}
