export interface PricingInformation {
  id: string
  name: string
  nameBadge?: string
  costUnit?: string
  href: string
  priceLabel?: string
  priceMonthly: number | string
  warning?: string
  warningTooltip?: string
  description: string
  preface: string
  features: { partners: string[]; features: (string | string[])[] }[]
  footer?: { partners: string[]; footer: string }[]
  cta: string
}

export const plans: PricingInformation[] = [
  {
    id: 'tier_free',
    name: 'Free',
    nameBadge: '',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=free',
    priceLabel: '',
    priceMonthly: 0,
    description: 'Perfect for passion projects & simple websites.',
    preface: 'Get started with:',
    features: [
      {
        partners: [],
        features: [
          'Unlimited API requests',
          '50,000 monthly active users',
          ['500 MB database space', '2 Core shared CPU • 1 GB RAM'],
          '5 GB bandwidth',
          '1 GB file storage',
          'Community support',
        ],
      },
      {
        partners: ['fly'],
        features: [
          'Unlimited API requests',
          '50,000 monthly active users',
          ['500 MB database space', '2 Core shared CPU • 1 GB RAM'],
          '5 GB bandwidth',
          'Community support',
        ],
      },
    ],
    footer: [
      {
        partners: [],
        footer: 'Free projects are paused after 1 week of inactivity. Limit of 2 active projects.',
      },
      {
        partners: ['fly'],
        footer: 'Free projects are paused after 1 week of inactivity. Limit of 1 active project.',
      },
    ],
    cta: 'Start for Free',
  },
  {
    id: 'tier_pro',
    name: 'Pro',
    nameBadge: 'Most Popular',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=pro',
    priceLabel: 'From',
    warning: '$10 in compute credits included',
    priceMonthly: 25,
    description: 'For production applications with the option to scale.',
    features: [
      {
        partners: [],
        features: [
          ['100,000 monthly active users', 'then $0.00325 per MAU'],
          ['8 GB database space', 'then $0.125 per GB'],
          ['250 GB bandwidth', 'then $0.09 per GB'],
          ['100 GB file storage', 'then $0.021 per GB'],
          'Email support',
          'Daily backups stored for 7 days',
          '7-day log retention',
        ],
      },
      {
        partners: ['fly'],
        features: [
          ['8 GB database space', 'then $0.125 per GB'],
          ['250 GB bandwidth', 'then $0.09 per GB'],
          'Email support',
          'Daily backups stored for 7 days',
          '7-day log retention',
        ],
      },
    ],
    preface: 'Everything in the Free plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_team',
    name: 'Team',
    nameBadge: '',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=team',
    priceLabel: 'From',
    warning: '$10 in compute credits included',
    priceMonthly: 599,
    description: 'Collaborate with different permissions and access patterns.',
    features: [
      {
        partners: [],
        features: [
          'SOC2',
          'HIPAA available as paid add-on',
          'Read only and Billing member roles',
          'SSO for Supabase Dashboard',
          'Priority email support & SLAs',
          'Daily backups stored for 14 days',
          '28-day log retention',
        ],
      },
    ],
    preface: 'Everything in the Pro plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_enterprise',
    name: 'Enterprise',
    href: 'https://forms.supabase.com/enterprise',
    description: 'For large-scale applications managing serious workloads.',
    features: [
      {
        partners: [],
        features: [
          'Designated Support manager',
          'Uptime SLAs',
          'On-premise support',
          '24×7×365 premium enterprise support',
          'Private Slack channel',
          'Custom Security Questionnaires',
        ],
      },
    ],
    priceLabel: '',
    priceMonthly: 'Custom',
    preface: '',
    cta: 'Contact Us',
  },
]

export function pickFeatures(plan: PricingInformation, billingPartner: string = '') {
  return (
    plan.features.find((f) => f.partners.includes(billingPartner))?.features ||
    plan.features.find((f) => f.partners.length === 0)!.features
  )
}

export function pickFooter(plan: PricingInformation, billingPartner: string = '') {
  return (
    plan.footer?.find((f) => f.partners.includes(billingPartner))?.footer ||
    plan.footer?.find((f) => f.partners.length === 0)!.footer
  )
}
