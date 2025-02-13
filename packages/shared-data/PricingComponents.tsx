import { QUOTAS, Tier, UsageItem } from './pricingConstants'

export function getQuotaPrice(
  product: UsageItem,
  tier: Tier,
  options: { longFormat?: boolean; splitOverage: true }
): [string, string]
export function getQuotaPrice(
  product: UsageItem,
  tier: Tier,
  options?: { longFormat?: boolean; splitOverage?: false }
): string
export function getQuotaPrice(
  product: UsageItem,
  tier: Tier,
  options?: { longFormat?: boolean; splitOverage?: boolean }
) {
  const data = QUOTAS[product][tier]

  if (data === 'CUSTOM') {
    return 'Custom'
  }

  if (data === 'UNAVAILABLE') {
    return `Unavailable on ${tier.charAt(0).toUpperCase() + tier.substring(1)} Plan`
  }

  if (!('overage' in data && data.overage)) {
    return data.base.toString({ longFormat: options?.longFormat })
  }

  if (options?.splitOverage) {
    return [
      data.base.toString({ longFormat: options?.longFormat }),
      `then $${data.overage.price.toUnit()} per ${data.overage.units.toStringOmitSingle()}`,
    ]
  }

  return `${data.base.toString({ longFormat: options?.longFormat })} included, then $${data.overage.price.toUnit()} per ${data.overage.units.toStringOmitSingle()}`
}

export function QuotaPrice({ product, tier }: { product: UsageItem; tier: Tier }) {
  return getQuotaPrice(product, tier)
}
