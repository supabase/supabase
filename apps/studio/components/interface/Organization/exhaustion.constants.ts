const EXHAUSTION_MESSAGES = {
  GRACE_PERIOD: {
    title: 'Your organization has exceeded its quota',
    message: (date: string) => `You are given a grace period until ${date}`,
  },
  GRACE_PERIOD_OVER: {
    title: 'Grace period is over',
    message: 'Your project will not be able to serve requests when you used up your quota.',
  },
  RESTRICTED: {
    title: 'Services Restricted',
    message:
      'Your project is unable to serve any requests as your organization has used up its quota.',
  },
  OVERDUE_INVOICES: {
    title: 'Outstanding Invoices',
    message: 'Please pay invoices to avoid service disruption.',
  },
} as const
