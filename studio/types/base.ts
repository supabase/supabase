export interface Organization {
  id: number
  slug: string
  name: string
  billing_email: string
  is_owner?: boolean
  stripe_customer_id?: string
}

export interface ProjectBase {
  id: number
  ref: string
  name: string
  status: string
  organization_id: number
  cloud_provider: string
  region: string
  inserted_at: string
  subscription_id: string
}

export interface Project extends ProjectBase {
  // available after projects.fetchDetail
  connectionString?: string
  kpsVersion?: string
  internalApiKey?: string
  restUrl?: string
  // store subscription tier products.metadata.supabase_prod_id
  subscription_tier?: string

  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
}

export interface User {
  id: number
  mobile: string
  primary_email: string
  username: string
  first_name: string
  last_name: string
  is_alpha_user: boolean
  free_project_limit: number
}

export interface Member {
  id: number
  is_owner: boolean
  profile: {
    id: number
    primary_email: string
    username: string
  }
}

export interface ResponseError {
  message: string
}

export interface ResponseFailure {
  error: ResponseError
}

export type SupaResponse<T> = T & ResponseFailure
