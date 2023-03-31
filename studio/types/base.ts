import jsonLogic from 'json-logic-js'
import { PermissionAction } from '@supabase/shared-types/out/constants'

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
  dbVersion?: string
  kpsVersion?: string
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
  mobile: string | null
  primary_email: string
  username: string
  first_name: string
  last_name: string
  gotrue_id: string
  is_alpha_user: boolean
  free_project_limit: number
}

export interface Member {
  id: number // To be deprecated after full ABAC roll out

  primary_email: string
  username: string
  gotrue_id?: string
  role_ids?: number[]

  invited_id?: number
  invited_at?: string

  is_owner?: boolean // To be deprecated after full ABAC roll out
}

export interface Role {
  id: number
  name: string
}

export interface Permission {
  actions: PermissionAction[]
  condition: jsonLogic.RulesLogic
  organization_id: number
  resources: string[]
}

export interface ResponseError {
  message: string
}

export interface ResponseFailure {
  error: ResponseError
}

export type SupaResponse<T> = T & ResponseFailure
