import type { components } from 'data/api'

export type SubscriptionTier =
  | 'tier_free'
  | 'tier_pro'
  | 'tier_payg'
  | 'tier_team'
  | 'tier_enterprise'

export type AddonVariantId = components['schemas']['AddonVariantId']

export type OrgSubscription = components['schemas']['GetSubscriptionResponse']

export type ProjectAddon = components['schemas']['BillingProjectAddonResponse']

export type PlanId = components['schemas']['BillingPlanId']

export type OrgPlan = components['schemas']['PlanResponse']

export type ProjectAddonType = components['schemas']['ProjectAddonType']

export interface ProjectAddonVariantMeta {
  cpu_cores?: number
  cpu_dedicated?: boolean
  baseline_disk_io_mbs?: number
  max_disk_io_mbs?: number
  memory_gb?: number
  connections_direct?: number
  connections_pooler?: number
  backup_duration_days?: number
  supported_cloud_providers?: string[]
}

export type ProjectSelectedAddon = components['schemas']['SelectedAddonResponse']
export type ProjectAvailableAddon = components['schemas']['AvailableAddonResponse']
