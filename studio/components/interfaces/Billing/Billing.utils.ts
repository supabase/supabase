import { SubscriptionAddon } from './AddOns/AddOns.types'
import {
  formatComputeSizes,
  formatCustomDomainOptions,
  formatPITROptions,
} from './AddOns/AddOns.utils'
import { StripeSubscription } from './Subscription/Subscription.types'

// Retrieve the price based on the default price id of the product
export const getProductPrice = (product: any) => {
  const defaultPriceId = product.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? product.prices.find((price: any) => price.id === defaultPriceId)
      : product.prices[0]
  return price
}

// Products can have multiple prices, this is to get the correct one based on the subscription
const getProductPriceId = (
  currentSubscription: StripeSubscription,
  product: any
): string | undefined => {
  const existingAddon = currentSubscription.addons.find((addon) => addon.prod_id === product.id)
  const existingAddonPriceId = product.prices.find(
    (price: any) => price.unit_amount === existingAddon?.unit_amount
  )
  return existingAddonPriceId?.id || getProductPrice(product)?.id
}

export const validateSubscriptionUpdatePayload = (selectedAddons: {
  computeSize: SubscriptionAddon
  pitrDuration: SubscriptionAddon
  customDomains: SubscriptionAddon
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
  currentSubscription: StripeSubscription,
  selectedTier: any,
  selectedAddons: {
    computeSize: SubscriptionAddon
    pitrDuration: SubscriptionAddon
    customDomains: SubscriptionAddon
  },
  nonChangeableAddons: SubscriptionAddon[],
  selectedPaymentMethod: string,
  region: string
) => {
  const { computeSize, pitrDuration, customDomains } = selectedAddons

  const computeSizePriceId = getProductPriceId(currentSubscription, computeSize)
  const pitrAddonPriceId = getProductPriceId(currentSubscription, pitrDuration)
  const customDomainPriceId = getProductPriceId(currentSubscription, customDomains)
  const tierPriceId = selectedTier ? getProductPrice(selectedTier) : undefined

  const nonChangeablePriceIds = nonChangeableAddons.map((addon) =>
    getProductPriceId(currentSubscription, addon)
  )

  const addons =
    region === 'af-south-1'
      ? []
      : [computeSizePriceId, pitrAddonPriceId, customDomainPriceId]
          .concat(nonChangeablePriceIds)
          .filter((x) => x !== undefined)
  const proration_date = Math.floor(Date.now() / 1000)

  return {
    ...(tierPriceId && { tier: tierPriceId.id }),
    addons,
    proration_date,
    payment_method: selectedPaymentMethod
  }
}

const findAddon = (
  subscription: StripeSubscription,
  addons: SubscriptionAddon[],
  key: string,
  defaultKey: string
): SubscriptionAddon => {
  const product = addons.find((option) => {
    const subscriptionAddon = subscription.addons.find((addon) =>
      addon.supabase_prod_id.includes(key)
    )
    return option.id === subscriptionAddon?.prod_id
  })
  if (product === undefined) {
    return addons.find(
      (addon) => addon.metadata.supabase_prod_id === defaultKey
    ) as SubscriptionAddon
  } else {
    const subscriptionAddon = subscription.addons.find((addon) => addon.prod_id === product.id)
    return { ...product, isLocked: subscriptionAddon?.unit_amount === 0 }
  }
}

export const getCurrentAddons = (
  currentSubscription: StripeSubscription,
  addons: SubscriptionAddon[]
): {
  computeSize: SubscriptionAddon
  pitrDuration: SubscriptionAddon
  customDomains: SubscriptionAddon
  supportPlan?: SubscriptionAddon
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
