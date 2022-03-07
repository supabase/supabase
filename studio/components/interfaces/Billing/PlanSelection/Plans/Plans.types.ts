export interface BillingPlan {
  id?: string
  priceId?: string
  name: string
  price: number | null
  description: string
  pointers: string[]
  isPopular: boolean
}
