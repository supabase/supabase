import { ProjectInfo } from 'data/projects/projects-query'
import type {
  OrgSubscription,
  ProjectAddonVariantMeta,
  ProjectSelectedAddon,
} from 'data/subscriptions/types'
import { INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS, IS_PLATFORM } from 'lib/constants'

export const getAddons = (selectedAddons: ProjectSelectedAddon[]) => {
  const computeInstance = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const customDomain = selectedAddons.find((addon) => addon.type === 'custom_domain')
  const ipv4 = selectedAddons.find((addon) => addon.type === 'ipv4')

  return { computeInstance, pitr, customDomain, ipv4 }
}

export const subscriptionHasHipaaAddon = (subscription?: OrgSubscription): boolean => {
  if (!IS_PLATFORM) return false

  return (subscription?.addons ?? []).some(
    (addon) => addon.supabase_prod_id === 'addon_security_hipaa'
  )
}

export const billingPartnerLabel = (billingPartner?: string) => {
  if (!billingPartner) return billingPartner

  switch (billingPartner) {
    case 'fly':
      return 'Fly.io'
    case 'aws':
      return 'AWS'
    default:
      return billingPartner
  }
}

export const generateComputeInstanceMeta = (
  computeInstance: ProjectSelectedAddon | undefined,
  project: ProjectInfo
) => {
  const computeMeta = computeInstance?.variant?.meta as ProjectAddonVariantMeta | undefined

  if (!computeMeta && project?.infra_compute_size === 'nano') {
    return INSTANCE_NANO_SPECS
  } else if (project?.infra_compute_size === 'micro') {
    return INSTANCE_MICRO_SPECS
  }

  return computeMeta
}
