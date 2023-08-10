export const invoicesKeys = {
  overdueInvoices: () => ['invoices', 'overdue'] as const,
  invoice: (id: string | undefined) => ['invoices', id] as const,
  projectInvoices: (projectRef: string | undefined) => ['invoices', projectRef] as const,
  projectInvoicesCount: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'count'] as const,
  upcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
  orgUpcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
}
