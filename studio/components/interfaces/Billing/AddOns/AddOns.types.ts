export interface SubscriptionAddon {
  id?: string
  name: string
  description?: string | null
  prices: AddonPrice[]
  metadata: {
    features: string
    default_price_id?: string
    supabase_prod_id: string
  }
  // UI specific, do not allow changes if add on has a $0 price to it
  isLocked?: boolean
}

export interface AddonPrice {
  id?: string
  currency: string
  unit_amount: number
  recurring: {
    aggregate_usage: number | null
    interval: 'month' | 'year'
    interval_count: number
    trial_period_days: number | null
    usage_type: string
  }
}
