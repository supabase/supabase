import { IS_PLATFORM } from 'lib/constants'
import { OrgSubscription, ProjectSelectedAddon } from 'data/subscriptions/types'

export const getAddons = (selectedAddons: ProjectSelectedAddon[]) => {
  const computeInstance = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const customDomain = selectedAddons.find((addon) => addon.type === 'custom_domain')
  const ipv4 = selectedAddons.find((addon) => addon.type === 'ipv4')

  return { computeInstance, pitr, customDomain, ipv4 }
}

export const subscriptionHasHipaaAddon = (subscription: OrgSubscription | undefined): boolean => {
  if (!IS_PLATFORM) return false

  return (
    subscription !== undefined &&
    subscription.addons.some((addon) => addon.supabase_prod_id === 'addon_security_hipaa')
  )
}
