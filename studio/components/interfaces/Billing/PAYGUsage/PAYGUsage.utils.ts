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
  let rawUsage = paygStats?.[feature.attribute]?.[feature.pricingModel]

  /**
   * Some features have a free quota
   *
   * Check there is included free quota,
   * and remove free quota amount from the raw usage derived from paygStats
   *
   * if the number is negative, then Math.max should return 0
   *
   * todo: move this logic to backend @mildtomato
   */
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
