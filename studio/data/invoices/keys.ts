export const invoicesKeys = {
  overdueInvoices: () => ['invoices', 'overdue'] as const,
  upcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
  orgUpcomingPreview: (projectRef: string | undefined) =>
    ['invoices', projectRef, 'upcoming-preview'] as const,
}
