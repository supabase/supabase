export const subscriptionKeys = {
  subscription: (projectRef: string | undefined) =>
    ['projects', projectRef, 'subscription'] as const,
}
