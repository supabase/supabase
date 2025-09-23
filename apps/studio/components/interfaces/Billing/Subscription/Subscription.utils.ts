import type { OrgSubscription, PlanId, ProjectSelectedAddon } from 'data/subscriptions/types'
import { IS_PLATFORM } from 'lib/constants'

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
    case 'vercel_marketplace':
      return 'Vercel'
    default:
      return billingPartner
  }
}

type PlanChangeType = 'upgrade' | 'downgrade' | 'none'

export const getPlanChangeType = (
  fromPlan: PlanId | undefined,
  toPlan: PlanId | undefined
): PlanChangeType => {
  const planChangeTypes: Record<PlanId, Record<PlanId, PlanChangeType>> = {
    free: {
      free: 'none',
      pro: 'upgrade',
      team: 'upgrade',
      enterprise: 'upgrade',
    },
    pro: {
      free: 'downgrade',
      pro: 'none',
      team: 'upgrade',
      enterprise: 'upgrade',
    },
    team: {
      free: 'downgrade',
      pro: 'downgrade',
      team: 'none',
      enterprise: 'upgrade',
    },
    enterprise: {
      free: 'downgrade',
      pro: 'downgrade',
      team: 'downgrade',
      enterprise: 'none',
    },
  }

  if (!fromPlan || !toPlan) {
    return 'none'
  }

  return planChangeTypes[fromPlan]?.[toPlan] ?? 'none'
}
