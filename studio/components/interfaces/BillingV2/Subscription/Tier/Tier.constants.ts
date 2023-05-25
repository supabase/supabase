export interface PricingInformation {
  id: string
  new: boolean
  name: string
  preface?: string
  features: string[]
  footer?: string
}

// This only contains the meta information of plans like description and features, prices are from the API
// Also ideally shift this to common folder (e.g packages/data)
export const SUBSCRIPTION_PLANS: PricingInformation[] = [
  {
    id: 'tier_free',
    new: false,
    name: 'Free',
    preface: undefined,
    features: [
      'Social OAuth providers',
      'Up to 500MB database & 1GB file storage',
      'Up to 2GB bandwidth',
      'Up to 50MB file uploads',
      '50,000 monthly active users',
      'Up to 500K Edge Function invocations',
      '200 concurrent Realtime connections',
      '2 million Realtime messages',
      '1-day log retention',
      'Community support',
    ],
    footer: undefined,
  },
  {
    id: 'tier_pro',
    new: false,
    name: 'Pro',
    preface: undefined,
    features: [
      'No project pausing',
      '8GB database & 100GB file storage',
      '50GB bandwidth',
      '5GB file uploads',
      '100,000 monthly active users',
      '2M Edge Function invocations',
      '500 concurrent Realtime connections',
      '5 million Realtime messages',
      '7-day log retention',
      'Email support',
      'Daily backups',
    ],
    footer:
      'Your cost control settings determine if you wish to pay for anything more than the above.',
  },
  {
    id: 'tier_team',
    new: true,
    name: 'Team',
    preface: 'Everything in Pro, plus:',
    features: [
      'Organization member roles (ABAC)',
      'Standardised Security Questionnaire',
      'SOC2',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      '14 day backups',
      '28 day log retention',
    ],
    footer: undefined,
  },
  {
    id: 'tier_enterprise',
    new: false,
    name: 'Enterprise',
    preface: 'For large-scale applications managing serious workloads',
    features: [`Designated Support manager & SLAs`, `SSO/ SAML`, `Custom contracts & invoicing`],
    footer: undefined,
  },
]

export const CANCELLATION_REASONS = [
  'Pricing',
  "My project isn't getting traction",
  'Poor customer service',
  'Missing feature',
  "I didn't see the value",
  "Supabase didn't meet my needs",
  'Dashboard is too complicated',
  'Postgres is too complicated',
  'Problem not solved',
  'Bug issues',
  'I decided to use something else',
  'My work has finished/discontinued',
  'I’m migrating to/starting a new project',
  'None of the above',
]
