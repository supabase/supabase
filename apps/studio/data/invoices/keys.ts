export const invoicesKeys = {
  overdueInvoices: () => ['invoices', 'overdue'] as const,

  invoice: (id: string | undefined) => ['invoice', id] as const,
  list: (slug: string | undefined, offset: number | undefined) =>
    ['invoices', slug, offset] as const,
  count: (slug: string | undefined) => ['invoices', slug, 'count'] as const,
  listAndCount: (slug: string | undefined) => ['invoices', slug] as const,

  projectInvoices: (projectRef: string | undefined, offset: number | undefined) =>
    ['invoices', projectRef, offset] as const,
  projectInvoicesCount: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'count'] as const,
  orgUpcomingPreview: (slug: string | undefined) => ['invoices', slug, 'upcoming-preview'] as const,
}
