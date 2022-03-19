export const formSubscriptionUpdatePayload = (
  selectedTier: any,
  selectedComputeSize: any,
  selectedPaymentMethod: string
) => {
  // [TODO] Small currently has no stripe product attached, so FE has a hardcoded ID just for that product
  // [UPDATE] it now has, just verify if attaching a Small will mess things up
  // const addons = selectedComputeSize.name.includes('[Small]')
  //   ? []
  //   : [selectedComputeSize.prices[0].id]
  const addons = [selectedComputeSize.prices[0].id]
  const proration_date = Math.floor(Date.now() / 1000)

  return {
    tier: selectedTier.prices[0].id,
    addons,
    proration_date,
    payment_method: selectedPaymentMethod,
  }
}
