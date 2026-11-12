import { CheckIcon } from 'lucide-react'

/**
 * Benefit copy for the upgrade screen. Deliberately not sourced from `shared-data/plans`:
 * that list is the marketing pricing page's, written for people choosing a plan, while
 * this one is written for someone who has already chosen and wants to know what they get.
 */
const PLAN_BENEFITS = {
  tier_pro: {
    headline: 'More compute, daily backups, no pausing, and email support whenever you need it.',
    features: [
      ['100,000 monthly active users', 'then $0.00325 per MAU'],
      ['8 GB disk per project', 'then $0.125 per GB'],
      ['250 GB egress', 'then $0.09 per GB'],
      ['250 GB cached egress', 'then $0.03 per GB'],
      ['100 GB file storage', 'then $0.0213 per GB'],
      ['Daily backups, kept 7 days'],
      ['7-day log retention'],
      ['Email support'],
      ['Log drains', '$60 per drain, per project'],
    ],
  },
  tier_team: {
    headline: 'Compliance, access controls, and priority support for teams shipping to production.',
    features: [
      ['SOC 2 report'],
      ['HIPAA available', 'as a paid add-on'],
      ['SSO for the Supabase Dashboard'],
      ['Project-scoped and read-only access roles'],
      ['Daily backups, kept 14 days'],
      ['28-day log retention'],
      ['Priority email support and SLAs'],
      ['Everything in Pro'],
    ],
  },
} as const

export type BenefitsPlanId = keyof typeof PLAN_BENEFITS

export const hasPlanBenefits = (tier: string | undefined): tier is BenefitsPlanId =>
  tier !== undefined && tier in PLAN_BENEFITS

export const PlanUpgradeBenefits = ({ tier }: { tier: BenefitsPlanId }) => {
  const { headline, features } = PLAN_BENEFITS[tier]

  return (
    <div>
      <h2 className="mb-6 text-2xl text-foreground text-balance">{headline}</h2>
      <ul className="space-y-3">
        {features.map(([label, description]) => (
          <li key={label} className="flex items-start gap-3">
            <CheckIcon
              size={14}
              strokeWidth={3}
              className="mt-1 shrink-0 text-brand"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm text-foreground">{label}</p>
              {description && (
                <p className="text-xs text-foreground-light" translate="no">
                  {description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
