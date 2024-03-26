export const subscriptionKeys = {
  orgSubscription: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'subscription'] as const,
  orgPlans: (orgSlug: string | undefined) => ['organizations', orgSlug, 'plans'] as const,

  addons: (projectRef: string | undefined) => ['projects', projectRef, 'addons'] as const,
}
