export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

export interface PricingInformation {
  id: string
  planId: PlanId
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
  features: (string | string[])[]
  footer?: string
  cta: string
}

export const plans: PricingInformation[] = [
  {
    id: 'tier_free',
    planId: 'free',
    name: 'Free',
    nameBadge: '',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=free',
    priceLabel: '',
    priceMonthly: 0,
    description: 'Perfect for passion projects & simple websites.',
    preface: 'Get started with:',
    features: [
      'Unlimited API requests',
      '50,000 monthly active users',
      ['500 MB database size', 'Shared CPU • 500 MB RAM'],
      ['5 GB egress'],
      ['5 GB cached egress'],
      '1 GB file storage',
      'Community support',
    ],
    footer: 'Free projects are paused after 1 week of inactivity. Limit of 2 active projects.',
    cta: 'Start for Free',
  },
  {
    id: 'tier_pro',
    planId: 'pro',
    name: 'Pro',
    nameBadge: 'Most Popular',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=pro',
    priceLabel: 'From',
    warning: '$10 in compute credits included',
    priceMonthly: 25,
    description: 'For production applications with the power to scale.',
    features: [
      ['100,000 monthly active users', 'then $0.00325 per MAU'],
      ['8 GB disk size per project', 'then $0.125 per GB'],
      ['250 GB egress', 'then $0.09 per GB'],
      ['250 GB cached egress', 'then $0.03 per GB'],
      ['100 GB file storage', 'then $0.021 per GB'],
      'Email support',
      'Daily backups stored for 7 days',
      '7-day log retention',
      ['Add Log Drains', 'additional $10 per drain, per project']
    ],
    preface: 'Everything in the Free Plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_team',
    planId: 'team',
    name: 'Team',
    nameBadge: '',
    costUnit: '/ month',
    href: 'https://supabase.com/dashboard/new?plan=team',
    priceLabel: 'From',
    warning: '$10 in compute credits included',
    priceMonthly: 599,
    description: 'Add features such as SSO, control over backups, and industry certifications.',
    features: [
      'SOC2',
      'Project-scoped and read-only access',
      'HIPAA available as paid add-on',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      'Daily backups stored for 14 days',
      '28-day log retention',
    ],
    preface: 'Everything in the Pro Plan, plus:',
    cta: 'Get Started',
  },
  {
    id: 'tier_enterprise',
    planId: 'enterprise',
    name: 'Enterprise',
    href: 'https://forms.supabase.com/enterprise',
    description: 'For large-scale applications running Internet scale workloads.',
    features: [
      'Designated Support manager',
      'Uptime SLAs',
      'BYO Cloud supported',
      '24×7×365 premium enterprise support',
      'Private Slack channel',
      'Custom Security Questionnaires',
    ],
    priceLabel: '',
    priceMonthly: 'Custom',
    preface: '',
    cta: 'Contact Us',
  },
] as const
