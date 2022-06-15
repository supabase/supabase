export const getProductPrice = (product: any) => {
  const defaultPriceId = product.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? product.prices.find((price: any) => price.id === defaultPriceId)
      : product.prices[0]
  return price
}

export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: any,
  selectedPaymentMethod: string,
  region: string
) => {
  const defaultPrice = selectedTier ? getProductPrice(selectedTier) : undefined
  const addons =
    region === 'af-south-1' || !selectedComputeSize.id ? [] : [selectedComputeSize.prices[0].id]
  const proration_date = Math.floor(Date.now() / 1000)
  return {
    ...(defaultPrice && { tier: defaultPrice.id }),
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}
