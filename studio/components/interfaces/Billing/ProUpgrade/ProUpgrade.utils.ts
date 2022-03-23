export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: any,
  selectedPaymentMethod: string,
  region: string
) => {
  const addons = region === 'af-south-1' ? [] : [selectedComputeSize.prices[0].id]
  const proration_date = Math.floor(Date.now() / 1000)
  return {
    tier: selectedTier.prices[0].id,
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}
