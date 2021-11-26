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
}
