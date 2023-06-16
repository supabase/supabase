export interface PaymentMethod {
  id: string
  billing_details: object
  card: {
    brand: string
    checks: object
    country: string
    exp_month: number
    exp_year: number
    fingerprint: string
    funding: string
    generated_from: any
    last4: string
    networks: object
    three_d_secure_usage: object
    wallet: any
  }
  created: number
  customer: string
  livemode: boolean
  metadata: object
  object: string
  type: string
}
