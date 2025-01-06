import { PermissionAction } from '@supabase/shared-types/out/constants'
import jsonLogic from 'json-logic-js'

export interface Organization {
  id: number
  slug: string
  name: string
  billing_email: string
  is_owner?: boolean
  opt_in_tags: string[]
  subscription_id?: string | null
  restriction_status: 'grace_period' | 'grace_period_over' | 'restricted' | null
  restriction_data: Record<string, never>
  managed_by: 'supabase' | 'vercel-marketplace' | 'aws-marketplace'
  partner_id?: string
}

/**
 * @deprecated Please use type from projects-query OR project-details-query.ts instead
 */
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
  preview_branch_refs: string[]
}

/**
 * @deprecated Please use type from project-details-query.ts instead
 */
export interface Project extends ProjectBase {
  // available after projects.fetchDetail
  connectionString?: string
  dbVersion?: string
  restUrl?: string
  lastDatabaseResizeAt?: string | null
  maxDatabasePreprovisionGb?: string | null
  parent_project_ref?: string
  is_branch_enabled?: boolean

  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  /**
   * Only available on client side only, for components that require the parentRef
   * irregardless of being on any branch, such as ProjectDropdown and Vercel integration
   * */
  parentRef?: string
  volumeSizeGb?: number
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

export interface Role {
  id: number
  name: string
}

export interface Permission {
  actions: PermissionAction[]
  condition: jsonLogic.RulesLogic
  organization_slug: string
  resources: string[]
  restrictive?: boolean
  project_refs: string[]
}

export interface ResponseFailure {
  error: ResponseError
}

export type SupaResponse<T> = T | ResponseFailure

export interface ResponseError {
  code?: number | string
  message: string
  requestId?: string
}
export interface Dictionary<T> {
  [Key: string]: T
}
