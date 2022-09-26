export const DEFAULT_VALUES = {
  category: {
    value: 'Problem',
    error: '',
  },
  severity: {
    value: 'Low',
    error: '',
  },
  project: {
    value: '',
    error: '',
  },
  subject: {
    value: '',
    error: '',
  },
  body: {
    value: '',
    error: '',
  },
}

export const CATEGORY_OPTIONS = [
  {
    value: 'Problem',
    label: 'Issue with project / API / Client library / REST API',
    description: 'Issues with project API, client libraries',
  },
  {
    value: 'Sales',
    label: 'Sales enquiry',
    description: 'Questions about pricing, paid plans and Enterprise plans',
  },
  {
    value: 'Billing',
    label: 'Billing',
    description: 'Issues with credit card charges | invoices | overcharing',
  },
  {
    value: 'Abuse',
    label: 'Abuse report',
    description: 'Report abuse of a Supabase project or Supabase brand',
  },
  {
    value: 'Refund',
    label: 'Refund enquiry',
    description: 'Formal enquiry form for requesting refunds',
  },
]

export const SEVERITY_OPTIONS = [
  {
    value: 'Low',
    label: 'Low',
    description: 'General guidance',
  },
  {
    value: 'Normal',
    label: 'Normal',
    description: 'System impaired',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Production system impaired',
  },
  {
    value: 'Urgent',
    label: 'Urgent',
    description: 'Production system down',
  },
  {
    value: 'Critical',
    label: 'Critical',
    description: 'Business-critical system down (Unavailable for free projects)',
  },
]
