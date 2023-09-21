import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import { ProjectSelectedAddon } from 'data/subscriptions/project-addons-query'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'

export const getAddons = (selectedAddons: ProjectSelectedAddon[]) => {
  const computeInstance = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const customDomain = selectedAddons.find((addon) => addon.type === 'custom_domain')

  return { computeInstance, pitr, customDomain }
}

export const subscriptionHasHipaaAddon = (
  subscription: OrgSubscription | ProjectSubscriptionResponse | undefined
): boolean => {
  return (
    subscription !== undefined &&
    subscription.addons.some((addon) => addon.supabase_prod_id === 'addon_security_hipaa')
  )
}

export const getSemanticVersion = (version: string) => {
  if (!version) return 0

  // e.g supabase-postgres-14.1.0.88
  // There's 4 segments instead so we can't use the semver package
  const segments = version.split('supabase-postgres-')
  const semver = segments[segments.length - 1]

  // e.g supabase-postgres-14.1.0.99-vault-rc1
  const formattedSemver = semver.split('-')[0]

  return Number(formattedSemver.split('.').join(''))
}
