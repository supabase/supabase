export interface PricingInformation {
  id: string
  name: string
  nameBadge?: string
  costUnit?: string
  href: string
  priceLabel?: string
  priceMonthly: number | string
  warning?: string
  warningPartner?: string
  warningTooltip?: string
  description: string
  preface: string
  features: (string | string[])[]
  featuresPartner: string[]
  footer?: string
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
      '50,000 monthly active users',
      ['500MB Database space', '2 Core shared CPU • 1 GB RAM'],
      '5GB bandwidth',
      '1GB file storage',
      'Community support',
    ],
    featuresPartner: [
      'Unlimited API requests',
      'Up to 500MB database space',
      'Up to 5GB bandwidth',
      '1-day log retention',
      'Community support',
    ],
    footer: 'Free projects are paused after 1 week of inactivity.',
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
      ['100,000 monthly active users', 'then $0.00325 per MAU'],
      ['8GB Database space', 'then $0.125 per GB'],
      ['250GB bandwidth', 'then $0.09 per GB'],
      ['100GB file storage', 'then $0.021 per GB'],
      'Daily backups stored for 7 days',
      '7-day log retention',
    ],
    // footer: 'Your cost control settings determine if you allow over-usage.',
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
      'SOC2',
      'HIPAA available as paid add-on',
      'Additional member roles',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      'Daily backups stored for 14 days',
      '28-day log retention',
    ],
    footer: 'Additional fees apply for usage beyond plan limits.',
    preface: 'Everything in the Pro plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_enterprise',
    name: 'Enterprise',
    href: 'https://forms.supabase.com/enterprise',
    description: 'For large-scale applications managing serious workloads.',
    features: [
      'Designated Support manager',
      'Up to 99.9% uptime SLAs',
      'On-premise support',
      '24×7×365 premium enterprise support',
      'Private Slack channel',
    ],
    featuresPartner: [
      `Designated Support manager & SLAs`,
      `24×7×365 premium enterprise support`,
      'Custom Security Questionnaires',
      `Private Slack channel`,
    ],
    priceLabel: '',
    priceMonthly: 'Custom',
    preface: '',
    footer: '',
    cta: 'Contact Us',
  },
]
