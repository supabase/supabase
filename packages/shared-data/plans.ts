import { ADDONS, gbDisplay, METERS, PLAN_BILLING, qty, usd, withUnit } from './pricing-catalog'
import type { PlanKey } from './pricing-catalog'

export type PlanId = PlanKey

export interface PricingInformation {
  id: 'tier_free' | 'tier_pro' | 'tier_team' | 'tier_enterprise'
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
    priceMonthly: PLAN_BILLING.free.priceMonthly,
    description: 'Perfect for passion projects & simple websites.',
    preface: 'Get started with:',
    features: [
      'Unlimited API requests',
      `${qty(METERS.maus.includedByPlan.free, 'comma')} monthly active users`,
      [
        `${gbDisplay(METERS.databaseDiskSize.includedByPlan.free)} database size`,
        'Shared CPU • 500 MB RAM',
      ],
      [`${qty(METERS.egress.includedByPlan.free)} GB egress`],
      [`${qty(METERS.cachedEgress.includedByPlan.free)} GB cached egress`],
      `${qty(METERS.storageSize.includedByPlan.free)} GB file storage`,
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
    warning: 'Includes one project running on Micro compute.',
    priceMonthly: PLAN_BILLING.pro.priceMonthly,
    description: 'For production applications with the power to scale.',
    features: [
      [
        `${qty(METERS.maus.includedByPlan.pro, 'comma')} monthly active users`,
        `then ${usd(METERS.maus.price)} per MAU`,
      ],
      [
        `${gbDisplay(METERS.databaseDiskSize.includedByPlan.pro)} disk size per project`,
        `then ${usd(METERS.databaseDiskSize.price)} per GB`,
      ],
      [
        `${withUnit(METERS.egress.includedByPlan.pro, 'GB')} egress`,
        `then ${usd(METERS.egress.price)} per GB`,
      ],
      [
        `${withUnit(METERS.cachedEgress.includedByPlan.pro, 'GB')} cached egress`,
        `then ${usd(METERS.cachedEgress.price)} per GB`,
      ],
      [
        `${withUnit(METERS.storageSize.includedByPlan.pro, 'GB')} file storage`,
        `then ${usd(METERS.storageSize.price)} per GB`,
      ],
      'Email support',
      'Daily backups stored for 7 days',
      '7-day log retention',
      [
        'Add Log Drains',
        `additional ${usd(ADDONS.logDrain.priceMonthlyPerDrain)} per drain, per project`,
      ],
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
    warning: 'Includes one project running on Micro compute.',
    priceMonthly: PLAN_BILLING.team.priceMonthly,
    description: 'Add features such as SSO, control over backups, and industry certifications.',
    features: [
      'SOC2 & ISO 27001',
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
