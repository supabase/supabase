export const stripeProductKeys = {
  get: (arId: string | undefined) => ['stripe', 'product', arId] as const,
}
