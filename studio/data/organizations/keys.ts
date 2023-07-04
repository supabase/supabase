export const organizationKeys = {
  list: () => ['organizations'] as const,
  detail: (slug: string | undefined) => ['organizations', slug, 'detail'] as const,
  paymentMethods: (slug: string | undefined) => ['organizations', slug, 'payment-methods'] as const,
  roles: (slug: string | undefined) => ['organizations', slug, 'roles'] as const,
  freeProjectLimitCheck: (slug: string | undefined) =>
    ['organizations', slug, 'free-project-limit-check'] as const,
  customerProfile: (slug: string | undefined) =>
    ['organizations', slug, 'customer-profile'] as const,
  auditLogs: (slug: string | undefined) => ['organizations', slug, 'audit-logs'] as const,
  migrateBilling: (slug: string | undefined) => ['organizations', slug, 'migrate-billing'] as const,
  migrateBillingPreview: (slug: string | undefined) =>
    ['organizations', slug, 'migrate-billing', 'preview'] as const,
}
