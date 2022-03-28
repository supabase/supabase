export const getProductPrice = (product: any) => {
  const defaultPriceId = product.metadata?.default_price_id
  const price =
    defaultPriceId !== undefined
      ? product.prices.find((price: any) => price.id === defaultPriceId)
      : product.prices[0]
  return price
}
