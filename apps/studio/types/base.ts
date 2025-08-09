import { PermissionAction } from '@supabase/shared-types/out/constants'
import { OrganizationBase } from 'data/organizations/organizations-query'
import { PlanId } from 'data/subscriptions/types'
import jsonLogic from 'json-logic-js'
import { BillingManagedBy } from 'lib/constants'

export interface Organization extends OrganizationBase {
  managed_by: BillingManagedBy
  partner_id?: string
  plan: { id: PlanId; name: string }
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
  connectionString?: string | null
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

export class ResponseError extends Error {
  code?: number
  requestId?: string
  retryAfter?: number

  constructor(message: string | undefined, code?: number, requestId?: string, retryAfter?: number) {
    super(message || 'API error happened while trying to communicate with the server.')
    this.code = code
    this.requestId = requestId
    this.retryAfter = retryAfter
  }
}

export interface Dictionary<T> {
  [Key: string]: T
}
