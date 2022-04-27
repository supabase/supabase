import { get, maxBy, sum } from 'lodash'
import { ChargeableProduct, PaygStats, ProductFeature } from './PAYGUsage.types'

/**
 *
 * Derives the most appropriate cost
 * depending on what kind of product feature we are displaying cost for.
 *
 * @param paygStats
 * @param feature
 *
 * @returns number
 */
export const deriveFeatureCost = (paygStats: PaygStats | undefined, feature: ProductFeature) => {
  console.log('paygStats', paygStats)
  let rawUsage = paygStats?.[feature.attribute]?.[feature.pricingModel]

  if (rawUsage && feature.freeQuota) {
    rawUsage = Math.max(0, rawUsage - feature.freeQuota)
  }

  const maximumValueOfTheMonth = rawUsage ?? 0

  return (maximumValueOfTheMonth / feature.unitQuantity) * feature.costPerUnit
}

export const deriveProductCost = (paygStats: any, product: ChargeableProduct) => {
  const costs = product.features.map((feature) => deriveFeatureCost(paygStats, feature))
  return sum(costs)
}
