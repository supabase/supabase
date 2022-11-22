import { DatabaseAddon } from './AddOns/AddOns.types'
import { formatComputeSizes, formatPITROptions } from './AddOns/AddOns.utils'
import { StripeSubscription } from './Subscription/Subscription.types'

export const getProductPrice = (product: any) => {
  const defaultPriceId = product.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? product.prices.find((price: any) => price.id === defaultPriceId)
      : product.prices[0]
  return price
}

export const validateSubscriptionUpdatePayload = (
  selectedComputeSize: DatabaseAddon,
  selectedPITRDuration?: DatabaseAddon
) => {
  if (selectedPITRDuration?.id !== undefined && selectedComputeSize.id === undefined) {
    return 'To enable PITR for your project, your project must minimally be on a Small Add-on.'
  }
  return undefined
}

export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: DatabaseAddon,
  selectedPITRDuration: DatabaseAddon | undefined,
  selectedPaymentMethod: string,
  region: string
) => {
  const defaultPrice = selectedTier ? getProductPrice(selectedTier) : undefined
  const addons =
    region === 'af-south-1'
      ? []
      : [selectedComputeSize.prices[0].id, selectedPITRDuration?.prices?.[0].id].filter(
          (x) => x !== undefined
        )
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
) => {
  const computeSizes = formatComputeSizes(addons)
  const pitrDurationOptions = formatPITROptions(addons)

  const currentComputeSize =
    computeSizes.find((option: any) => {
      const subscriptionComputeSize = currentSubscription?.addons.find((addon) =>
        addon.supabase_prod_id.includes('_instance_')
      )
      return option.id === subscriptionComputeSize?.prod_id
    }) ||
    (computeSizes.find(
      (option: any) => option.metadata.supabase_prod_id === 'addon_instance_micro'
    ) as DatabaseAddon)

  const currentPITRDuration =
    pitrDurationOptions.find((option: any) => {
      const subscriptionComputeSize = currentSubscription?.addons.find((addon) =>
        addon.supabase_prod_id.includes('_pitr_')
      )
      return option.id === subscriptionComputeSize?.prod_id
    }) ||
    (pitrDurationOptions.find(
      (option: any) => option.metadata.supabase_prod_id === 'addon_pitr_0days'
    ) as DatabaseAddon)

  return { currentComputeSize, currentPITRDuration }
}
