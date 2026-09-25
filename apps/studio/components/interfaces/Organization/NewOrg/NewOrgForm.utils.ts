export type OrgTier = 'tier_free' | 'tier_pro' | 'tier_payg' | 'tier_team'

/**
 * Derives the telemetry tier from the (non-null) submitted form values. This is the single source
 * of truth for translating a plan + spend cap into a tier, so callers can never emit an
 * organization creation event without a valid tier.
 */
export const deriveTier = (plan: 'FREE' | 'PRO' | 'TEAM', spendCap: boolean): OrgTier => {
  const dbTier = plan === 'PRO' && !spendCap ? 'PAYG' : plan
  return ('tier_' + dbTier.toLowerCase()) as OrgTier
}
