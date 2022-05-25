export interface ChargeableProduct {
  title: string
  iconUrl: string
  features: ProductFeature[]
}

export interface ProductFeature {
  title: string
  attribute: string
  costPerUnit: number
  unitQuantity: number
  pricingModel: PricingModel
  freeQuota?: number
}

export type PaygStats = { [key: string]: { sum: number; max: number } }

export type PricingModel = 'sum' | 'max'
