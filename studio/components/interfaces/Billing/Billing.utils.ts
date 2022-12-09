import { add } from 'lodash'
import { DatabaseAddon } from './AddOns/AddOns.types'
import {
  formatComputeSizes,
  formatCustomDomainOptions,
  formatPITROptions,
} from './AddOns/AddOns.utils'
import { StripeSubscription } from './Subscription/Subscription.types'

export const getProductPrice = (product: any) => {
  const defaultPriceId = product.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? product.prices.find((price: any) => price.id === defaultPriceId)
      : product.prices[0]
  return price
}

export const validateSubscriptionUpdatePayload = (selectedAddons: {
  computeSize: DatabaseAddon
  pitrDuration: DatabaseAddon
  customDomains: DatabaseAddon
}) => {
  if (
    selectedAddons.pitrDuration?.id !== undefined &&
    selectedAddons.computeSize.id === undefined
  ) {
    return 'To enable PITR for your project, your project must minimally be on a Small Add-on.'
  }
  return undefined
}

export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedAddons: {
    computeSize: DatabaseAddon
    pitrDuration: DatabaseAddon
    customDomains: DatabaseAddon
  },
  selectedPaymentMethod: string,
  region: string
) => {
  const { computeSize, pitrDuration, customDomains } = selectedAddons
  const defaultPrice = selectedTier ? getProductPrice(selectedTier) : undefined
  const addons =
    region === 'af-south-1'
      ? []
      : [
          computeSize.prices[0].id,
          pitrDuration?.prices?.[0].id,
          customDomains?.prices?.[0].id,
        ].filter((x) => x !== undefined)
  const proration_date = Math.floor(Date.now() / 1000)
  return {
    ...(defaultPrice && { tier: defaultPrice.id }),
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}

const findAddon = (
  subscription: StripeSubscription,
  addons: DatabaseAddon[],
  key: string,
  defaultKey: string
): DatabaseAddon => {
  const product = addons.find((option) => {
    const subscriptionAddon = subscription.addons.find((addon) =>
      addon.supabase_prod_id.includes(key)
    )
    return option.id === subscriptionAddon?.prod_id
  })
  if (product === undefined) {
    return addons.find((addon) => addon.metadata.supabase_prod_id === defaultKey) as DatabaseAddon
  } else {
    const subscriptionAddon = subscription.addons.find((addon) => addon.prod_id === product.id)
    return { ...product, isLocked: subscriptionAddon?.unit_amount === 0 }
  }
}

export const getCurrentAddons = (
  currentSubscription: StripeSubscription,
  addons: DatabaseAddon[]
): {
  computeSize: DatabaseAddon
  pitrDuration: DatabaseAddon
  customDomains: DatabaseAddon
  supportPlan?: DatabaseAddon
} => {
  const computeSizes = formatComputeSizes(addons)
  const pitrDurationOptions = formatPITROptions(addons)
  const customDomainOptions = formatCustomDomainOptions(addons)

  const computeSize = findAddon(
    currentSubscription,
    computeSizes,
    '_instance_',
    'addon_instance_micro'
  )
  const pitrDuration = findAddon(
    currentSubscription,
    pitrDurationOptions,
    '_pitr_',
    'addon_pitr_0days'
  )
  const customDomains = findAddon(
    currentSubscription,
    customDomainOptions,
    '_custom_domains',
    'addon_custom_domains_disabled'
  )

  const supportPlan = addons.find((option) => {
    const subscriptionSupportPlan = currentSubscription?.addons.find((addon) =>
      addon.supabase_prod_id.includes('_support_')
    )
    return option.id === subscriptionSupportPlan?.prod_id
  })

  return { computeSize, pitrDuration, customDomains, supportPlan }
}
