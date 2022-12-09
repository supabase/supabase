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

  console.log({ currentSubscription })

  const computeSize =
    computeSizes.find((option: any) => {
      const subscriptionComputeSize = currentSubscription?.addons.find((addon) =>
        addon.supabase_prod_id.includes('_instance_')
      )
      return option.id === subscriptionComputeSize?.prod_id
    }) ||
    (computeSizes.find(
      (option: any) => option.metadata.supabase_prod_id === 'addon_instance_micro'
    ) as DatabaseAddon)

  const pitrDuration =
    pitrDurationOptions.find((option: any) => {
      const subscriptionPitrDuration = currentSubscription?.addons.find((addon) =>
        addon.supabase_prod_id.includes('_pitr_')
      )
      return option.id === subscriptionPitrDuration?.prod_id
    }) ||
    (pitrDurationOptions.find(
      (option: any) => option.metadata.supabase_prod_id === 'addon_pitr_0days'
    ) as DatabaseAddon)

  const customDomains =
    customDomainOptions.find((option: any) => {
      const subscriptionCustomDomain = currentSubscription?.addons.find((addon) =>
        addon.supabase_prod_id.includes('_custom_domains')
      )
      return option.id === subscriptionCustomDomain?.prod_id
    }) ||
    (customDomainOptions.find(
      (option: any) => option.metadata.supabase_prod_id === 'addon_custom_domains_disabled'
    ) as DatabaseAddon)

  const supportPlan = addons.find((option: any) => {
    const subscriptionSupportPlan = currentSubscription?.addons.find((addon) =>
      addon.supabase_prod_id.includes('_support_')
    )
    return option.id === subscriptionSupportPlan?.prod_id
  })

  return { computeSize, pitrDuration, customDomains, supportPlan }
}
