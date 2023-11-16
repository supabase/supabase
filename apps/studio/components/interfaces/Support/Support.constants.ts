import { SupportCategories } from '@supabase/shared-types/out/constants'

export const CATEGORY_OPTIONS = [
  {
    value: SupportCategories.PROBLEM,
    label: 'Issues with APIs / client libraries',
    description: "Issues with your project's API and client libraries",
    query: undefined,
  },
  {
    value: SupportCategories.DASHBOARD_BUG,
    label: 'Dashboard bug',
    description: 'Issues with the Supabase dashboard',
    query: undefined,
  },
  {
    value: SupportCategories.DATABASE_UNRESPONSIVE,
    label: 'Database unresponsive',
    description: 'Issues with connecting to your database',
    query: 'Unable to connect',
  },
  {
    value: SupportCategories.PERFORMANCE_ISSUES,
    label: 'Performance issues',
    description: 'Reporting of performance issues is only available on the Pro plan',
    query: 'Performance',
  },
  {
    value: SupportCategories.SALES_ENQUIRY,
    label: 'Sales enquiry',
    description: 'Questions about pricing, paid plans and Enterprise plans',
    query: undefined,
  },
  {
    value: SupportCategories.BILLING,
    label: 'Billing',
    description: 'Issues with credit card charges | invoices | overcharging',
    query: undefined,
  },
  {
    value: SupportCategories.ABUSE,
    label: 'Abuse report',
    description: 'Report abuse of a Supabase project or Supabase brand',
    query: undefined,
  },
  {
    value: SupportCategories.REFUND,
    label: 'Refund enquiry',
    description: 'Formal enquiry form for requesting refunds',
    query: undefined,
  },
  {
    value: SupportCategories.LOGIN_ISSUES,
    label: 'Issues with logging in',
    description: 'Issues with logging in and MFA',
    query: undefined,
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
]

export const SERVICE_OPTIONS = [
  {
    id: 1,
    name: 'Authentication',
    value: 'Authentication',
    disabled: false,
  },
  {
    id: 2,
    name: 'Dashboard',
    value: 'Dashboard',
    disabled: false,
  },
  {
    id: 3,
    name: 'Database',
    value: 'Database',
    disabled: false,
  },
  {
    id: 4,
    name: 'Edge Functions',
    value: 'Edge Functions',
    disabled: false,
  },
  {
    id: 5,
    name: 'Realtime',
    value: 'Realtime',
    disabled: false,
  },
  {
    id: 6,
    name: 'Storage',
    value: 'Storage',
    disabled: false,
  },
  {
    id: 7,
    name: 'Others',
    value: 'Others',
    disabled: false,
  },
]

export const GITHUB_LINKS = [
  {
    name: 'supabase-js',
    description: 'For issues with our Javascript client',
    url: 'https://github.com/supabase/supabase-js/issues',
  },
  {
    name: 'supabase-flutter',
    description: 'For issues with our Flutter integration',
    url: 'https://github.com/supabase-community/supabase-flutter/issues',
  },
  {
    name: 'supabase',
    description: 'For other issues about our API',
    url: 'https://github.com/supabase/supabase/issues',
  },
]
