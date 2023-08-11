export const invoicesKeys = {
  overdueInvoices: () => ['invoices', 'overdue'] as const,

  invoice: (id: string | undefined) => ['invoice', id] as const,
  list: (customerId: string | undefined, slug: string | undefined) =>
    ['invoices', customerId, slug] as const,
  count: (customerId: string | undefined, slug: string | undefined) =>
    ['invoices', customerId, slug, 'count'] as const,

  projectInvoices: (projectRef: string | undefined) => ['invoices', projectRef] as const,
  projectInvoicesCount: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'count'] as const,
  upcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
  orgUpcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
}
