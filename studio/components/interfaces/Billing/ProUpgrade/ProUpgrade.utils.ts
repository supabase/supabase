export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: any,
  selectedPaymentMethod: string,
  region: string
) => {
  const defaultPriceId = selectedTier.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? selectedTier.prices.find((price: any) => price.id === defaultPriceId).id
      : selectedTier.prices[0].id

  const addons =
    region === 'af-south-1' || !selectedComputeSize.id ? [] : [selectedComputeSize.prices[0].id]
  const proration_date = Math.floor(Date.now() / 1000)
  return {
    tier: price,
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}
