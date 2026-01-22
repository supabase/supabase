// Iyzico API Types

export interface IyzicoCustomer {
  name: string
  surname: string
  email: string
  gsmNumber: string
  identityNumber: string
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode: string
  }
}

export interface CreateSubscriptionRequest {
  pricingPlanReferenceCode: string
  packageName: string
  customer: IyzicoCustomer
}

export interface IyzicoResponse {
  status: string
  systemTime: number
  errorCode?: string
  errorMessage?: string
}

export interface IyzicoCheckoutFormResponse extends IyzicoResponse {
  checkoutFormContent?: string
  token?: string
  tokenExpireTime?: number
}

export interface IyzicoSubscriptionResponse extends IyzicoResponse {
  referenceCode?: string
  subscriptionStatus?: string
  startDate?: number
  endDate?: number
  pricingPlanReferenceCode?: string
  customerReferenceCode?: string
}

export interface IyzicoProduct {
  referenceCode: string
  name: string
  description?: string
  price: number
  currencyCode: string
  paymentInterval: string
  paymentIntervalCount: number
  trialPeriodDays?: number
  planPaymentType: string
  status: string
}

export interface IyzicoProductsResponse extends IyzicoResponse {
  products?: IyzicoProduct[]
}

// Database Types
export interface SubscriptionRequest {
  id: string
  user_id: string
  pricing_plan_reference_code: string
  package_name: string
  iyzico_token?: string
  conversation_id?: string
  reference_code?: string
  customer_data: IyzicoCustomer
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'FAILED'
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
  timestamp?: string
}

export interface CreateSubscriptionResponse {
  checkoutFormContent: string
  token: string
  tokenExpireTime: number
  callbackUrl: string
}

export interface SubscriptionStatusResponse {
  referenceCode: string
  subscriptionStatus: string
  startDate: number
  endDate: number
  pricingPlanReferenceCode: string
  customerReferenceCode: string
} 