export const stripeAtlasKeys = {
  application: (stripeAtlasToken: string | undefined) =>
    ['stripe-atlas', 'application', stripeAtlasToken] as const,
}
