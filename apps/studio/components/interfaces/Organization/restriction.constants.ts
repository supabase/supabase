// Add at the top of the file, with other imports
export const RESTRICTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Organization plan has exceeded its quota',
    description: (date: string) => `You have been given a grace period until ${date}`,
  },
  GRACE_PERIOD_OVER: {
    title: 'Grace period is over',
    description: 'Your projects will not be able to serve requests when you used up your quota',
  },
  RESTRICTED: {
    title: 'Services restricted',
    description:
      'Your projects are unable to serve any requests as your organization plan has used up its quota',
  },
  OVERDUE_INVOICES: {
    title: 'Outstanding invoices',
    description: 'Please pay invoices to avoid service disruption',
  },
  OVERDUE_INVOICES_FROM_OTHER_ORGS: {
    title: 'Outstanding invoices in other organization',
    description: 'Please pay invoices for other organization to avoid service disruption',
  },
  MISSING_BILLING_INFO: {
    title: 'Missing billing information',
    description:
      'Please add a billing address to avoid restrictions. If you are a registered business, please add a tax ID too',
  },
} as const
