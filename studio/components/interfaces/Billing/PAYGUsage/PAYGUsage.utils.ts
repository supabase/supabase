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
  const maximumValueOfTheMonth = paygStats?.[feature.attribute]?.[feature.pricingModel] ?? 0
  return (maximumValueOfTheMonth / feature.unitQuantity) * feature.costPerUnit
}

export const deriveProductCost = (paygStats: any, product: ChargeableProduct) => {
  const costs = product.features.map((feature) => deriveFeatureCost(paygStats, feature))
  return sum(costs)
}
