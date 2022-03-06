export interface StripeSubscription {
  tier: StripeProduct
  billing: {
    current_period_end: number
    current_period_start: number
    billing_cycle_anchor: number
  }
  addons: StripeProduct[]
}

export interface StripeProduct {
  name: string
  prod_id: string
  unit_amount: number
}
