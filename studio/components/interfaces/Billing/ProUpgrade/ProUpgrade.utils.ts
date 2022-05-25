import { getProductPrice } from '../Billing.utils'

export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: any,
  selectedPaymentMethod: string,
  region: string
) => {
  const defaultPrice = getProductPrice(selectedTier)
  const addons =
    region === 'af-south-1' || !selectedComputeSize.id ? [] : [selectedComputeSize.prices[0].id]
  const proration_date = Math.floor(Date.now() / 1000)
  return {
    tier: defaultPrice.id,
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}
