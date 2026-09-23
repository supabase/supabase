export const subscriptionKeys = {
  orgSubscription: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'subscription'] as const,
  orgBalance: (orgSlug: string | undefined) => ['organizations', orgSlug, 'balance'] as const,
  orgCreditsBurndown: (orgSlug: string | undefined, startDate: string, endDate: string) =>
    ['organizations', orgSlug, 'credits-burndown', startDate, endDate] as const,
  orgPlans: (orgSlug: string | undefined) => ['organizations', orgSlug, 'plans'] as const,

  addons: (projectRef: string | undefined) => ['projects', projectRef, 'addons'] as const,
}
