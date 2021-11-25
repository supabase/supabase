import { sum } from 'lodash'
import { ChargeableProduct, ProductFeature } from './PAYGUsage.types'

export const deriveFeatureCost = (paygStats: any, feature: ProductFeature) => {
  const maximumValueOfTheMonth = paygStats?.[feature.attribute] ?? 0
  return (maximumValueOfTheMonth / feature.unitQuantity) * feature.costPerUnit
}

export const deriveProductCost = (paygStats: any, product: ChargeableProduct) => {
  const costs = product.features.map((feature) => deriveFeatureCost(paygStats, feature))
  return sum(costs)
}
