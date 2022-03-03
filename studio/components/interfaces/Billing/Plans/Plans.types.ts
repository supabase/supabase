export interface BillingPlan {
  name: string
  price: number | null
  description: string
  pointers: string[]
  isPopular: boolean
}
