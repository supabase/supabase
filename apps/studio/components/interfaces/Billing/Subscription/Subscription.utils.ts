import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import { ProjectSelectedAddon } from 'data/subscriptions/project-addons-query'

export const getAddons = (selectedAddons: ProjectSelectedAddon[]) => {
  const computeInstance = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitr = selectedAddons.find((addon) => addon.type === 'pitr')
  const customDomain = selectedAddons.find((addon) => addon.type === 'custom_domain')

  return { computeInstance, pitr, customDomain }
}

export const subscriptionHasHipaaAddon = (subscription: OrgSubscription | undefined): boolean => {
  return (
    subscription !== undefined &&
    subscription.addons.some((addon) => addon.supabase_prod_id === 'addon_security_hipaa')
  )
}
