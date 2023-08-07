export const organizationKeys = {
  list: () => ['organizations'] as const,
  detail: (slug: string | undefined) => ['organizations', slug, 'detail'] as const,
  paymentMethods: (slug: string | undefined) => ['organizations', slug, 'payment-methods'] as const,
  roles: (slug: string | undefined) => ['organizations', slug, 'roles'] as const,
  rolePermissions: (slug: string | undefined, roleId: number) =>
    ['organizations', slug, 'role', roleId, 'permissions'] as const,
  freeProjectLimitCheck: (slug: string | undefined) =>
    ['organizations', slug, 'free-project-limit-check'] as const,
  customerProfile: (slug: string | undefined) =>
    ['organizations', slug, 'customer-profile'] as const,
  auditLogs: (
    slug: string | undefined,
    { date_start, date_end }: { date_start: string | undefined; date_end: string | undefined }
  ) => ['organizations', slug, 'audit-logs', { date_start, date_end }] as const,
  migrateBilling: (slug: string | undefined) => ['organizations', slug, 'migrate-billing'] as const,
  migrateBillingPreview: (slug: string | undefined) =>
    ['organizations', slug, 'migrate-billing', 'preview'] as const,
  taxIds: (slug: string | undefined) => ['organizations', slug, 'tax-ids'] as const,
}
