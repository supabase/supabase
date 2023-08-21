export interface PricingInformation {
  id: string
  name: string
  nameBadge?: string
  costUnit?: string
  costUnitOrg?: string
  href: string
  priceLabel?: string
  priceMonthly: number | string
  warning?: string
  description: string
  preface: string
  features: string[]
  featuresOrg?: string[]
  footer?: string
  cta: string
}

export const plans: PricingInformation[] = [
  {
    id: 'tier_free',
    name: 'Free',
    nameBadge: '',
    costUnit: '/ month / project',
    costUnitOrg: '/ month',
    href: 'https://supabase.com/dashboard/new/new-project',
    priceLabel: '',
    priceMonthly: 0,
    warning: 'Limit of 2 free projects',
    description: 'Perfect for passion projects & simple websites.',
    preface: 'Get started with:',
    features: [
      'Unlimited API requests',
      'Social OAuth providers',
      'Up to 500MB database space',
      'Up to 1GB file storage',
      'Up to 2GB bandwidth',
      'Up to 50MB file uploads',
      'Up to 50,000 monthly active users',
      'Up to 500K Edge Function invocations',
      'Up to 200 concurrent Realtime connections',
      'Up to 2 million Realtime messages',
      '1-day log retention',
      'Community support',
    ],
    footer: 'Free projects are paused after 1 week of inactivity.',
    cta: 'Get Started',
  },
  {
    id: 'tier_pro',
    name: 'Pro',
    nameBadge: '',
    costUnit: '/ month / project',
    costUnitOrg: '/ month',
    href: 'https://supabase.com/dashboard/new/new-project',
    priceLabel: 'From',
    warning: 'Usage-based plan',
    priceMonthly: 25,
    description: 'For production applications with the option to scale.',
    featuresOrg: [
      '$10 Compute Credits',
      'No project pausing',
      'Daily backups stored for 7 days',
      '8GB database space included',
      '100GB file storage included',
      '50GB bandwidth included',
      '5GB file uploads included',
      '100,000 monthly active users included',
      '2M Edge Function invocations included',
      '500 concurrent Realtime connections included',
      '5 million Realtime messages included',
      '7-day log retention',
      'Email support',
    ],
    features: [
      'No project pausing',
      'Daily backups stored for 7 days',
      '8GB database space included',
      '100GB file storage included',
      '50GB bandwidth included',
      '5GB file uploads included',
      '100,000 monthly active users included',
      '2M Edge Function invocations included',
      '500 concurrent Realtime connections included',
      '5 million Realtime messages included',
      '7-day log retention',
      'Email support',
    ],
    footer: 'Your cost control settings determine if you allow over-usage.',
    preface: 'Everything in the Free plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_team',
    name: 'Team',
    nameBadge: 'New',
    costUnit: '/ month',
    costUnitOrg: '/ month',
    href: 'https://forms.supabase.com/team',
    priceLabel: 'From',
    warning: 'Usage-based plan',
    priceMonthly: 599,
    description: 'Collaborate with different permissions and access patterns.',
    features: [
      'Additional Organization member roles',
      'Daily backups stored for 14 days',
      'Standardised Security Questionnaire',
      'SOC2',
      'HIPAA',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      '28-day log retention',
    ],
    footer: 'Additional fees apply for usage beyond included usage.',
    preface: 'Everything in the Pro plan, plus:',
    cta: 'Contact Us',
  },
  {
    id: 'tier_enterprise',
    name: 'Enterprise',
    href: 'https://forms.supabase.com/enterprise',
    description: 'For large-scale applications managing serious workloads.',
    features: [
      `Designated Support manager & SLAs`,
      `Enterprise OAuth providers`,
      `SSO/SAML`,
      `On-premise support`,
      `24×7×365 premium enterprise support`,
      `Private Slack channel`,
    ],
    priceLabel: '',
    priceMonthly: 'Contact us',
    preface: '',
    footer: '',
    cta: 'Contact Us',
  },
]
