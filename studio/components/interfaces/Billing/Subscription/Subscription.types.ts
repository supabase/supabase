export interface StripeSubscription {
  tier: {
    name: string
    prod_id: string
    unit_amount: number
  }
  billing: {
    current_period_end: number
    current_period_start: number
    billing_cycle_anchor: number
  }
  addons: StripeAddon[]
}

export interface StripeAddon {
  name: string
  prod_id: string
  unit_amount: number
}
