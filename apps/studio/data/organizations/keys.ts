export const organizationKeys = {
  list: () => ['organizations'] as const,
  detail: (slug?: string) => ['organizations', slug] as const,
  members: (slug?: string) => ['organizations', slug, 'members'] as const,
  mfa: (slug?: string) => ['organizations', slug, 'mfa'] as const,
  paymentMethods: (slug: string | undefined) => ['organizations', slug, 'payment-methods'] as const,
  entitlements: (slug: string | undefined) => ['entitlements', slug] as const,
  roles: (slug: string | undefined) => ['organizations', slug, 'roles'] as const,
  freeProjectLimitCheck: (slug: string | undefined) =>
    ['organizations', slug, 'free-project-limit-check'] as const,
  customerProfile: (slug: string | undefined) =>
    ['organizations', slug, 'customer-profile'] as const,
  auditLogs: (
    slug: string | undefined,
    { date_start, date_end }: { date_start: string | undefined; date_end: string | undefined }
  ) => ['organizations', slug, 'audit-logs', { date_start, date_end }] as const,
  subscriptionPreview: (slug: string | undefined, tier: string | undefined) =>
    ['organizations', slug, 'subscription', 'preview', tier] as const,
  taxId: (slug: string | undefined) => ['organizations', slug, 'tax-ids'] as const,
  tokenValidation: (slug: string | undefined, token: string | undefined) =>
    ['organizations', slug, 'validate-token', token] as const,
  projectClaim: (slug: string, token: string) =>
    ['organizations', slug, 'project-claim', token] as const,
  availableRegions: (slug: string | undefined, cloudProvider: string, size?: string) =>
    ['organizations', slug, 'available-regions', cloudProvider, size] as const,
  previewCreditCode: (slug: string | undefined, code: string) =>
    ['organizations', slug, 'preview-credit-code', code] as const,
}
