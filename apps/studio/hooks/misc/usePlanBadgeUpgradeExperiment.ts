import { IS_PLATFORM, safeLocalStorage, useFeatureFlags, useParams } from 'common'
import { useEffect, useMemo } from 'react'

import { isPartnerBillingOrganization } from '@/data/organizations/managed-by-utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { useProfile } from '@/lib/profile'
import type { Organization } from '@/types'

// PostHog flag key (camelCase, matches other flag naming in the codebase).
export const PLAN_BADGE_UPGRADE_FLAG_NAME = 'planBadgeUpgrade'

// snake_case experiment ID so the auto-fired exposure event name matches the
// `[experiment_id]_experiment_exposed` typed event registered in telemetry-constants.ts.
const PLAN_BADGE_UPGRADE_EXPERIMENT_ID = 'plan_badge_upgrade'

// localStorage key prefix for the seeded variant (see hook docs). Keyed per org slug
// because eligibility folds in that org's plan.
const PLAN_BADGE_UPGRADE_SEED_PREFIX = 'supabase-plan-badge-upgrade-variant-'

export type PlanBadgeUpgradeVariant = 'control' | 'test'

const VALID_VARIANTS: PlanBadgeUpgradeVariant[] = ['control', 'test']

/**
 * Whether this org can complete an upgrade through the dashboard's plan panel, which is
 * what the badge links to. Anyone who can't is excluded from the experiment entirely — not
 * just from the treatment — so they don't sit in the exposure cohort as guaranteed
 * non-converters.
 *
 * Org-level only, so it resolves as soon as the organization query does. The user-level
 * half of eligibility (`billing:all`) resolves separately — see `isPlanBadgeUpgradeEligible`.
 *
 * Mirrors the eligibility `UpgradePlanButton` applies before linking to the same panel;
 * the one case deliberately left in is a free-plan member without `BILLING_WRITE`, since
 * `PlanUpdateSidePanel` renders `RequestUpgradeToBillingOwners` per plan card for them —
 * that's a real next action, not a dead end.
 */
export const isOrganizationUpgradableInDashboard = (organization: Organization | undefined) => {
  if (organization?.plan?.id !== 'free') return false

  // Partner-managed orgs change plans through Vercel / AWS Marketplace / Stripe Projects.
  // `PlanUpdateSidePanel` shows a `PartnerManagedResource` notice and disables every paid
  // tier for them, so the panel has no enabled action to convert on.
  if (organization.managed_by !== MANAGED_BY.SUPABASE) return false
  if (isPartnerBillingOrganization(organization.billing_partner)) return false

  return true
}

/**
 * Full eligibility: the org can be upgraded in-dashboard *and* this user can reach the
 * billing page at all. With `billing:all` disabled, `/org/[slug]/billing` renders
 * `UnknownInterface`, so the badge would link to a dead end — `UpgradePlanButton` falls
 * back to the support form in that case.
 *
 * Note `billingAll` reads from the profile, which loads independently of the organization
 * query and defaults to `true` while pending. Callers must not treat this as definitive
 * until the profile has resolved, or a user with billing disabled can be enrolled during
 * the gap.
 */
export const isPlanBadgeUpgradeEligible = (
  organization: Organization | undefined,
  billingAll: boolean
) => isOrganizationUpgradableInDashboard(organization) && billingAll

interface UsePlanBadgeUpgradeExperimentOptions {
  /**
   * Whether this call site is the one that actually renders the badge. Only that call site
   * should fire the exposure event — see the note on dilution in the hook docs.
   */
  trackExposure?: boolean
}

/**
 * Shared experiment state for the "make the Free plan badge a clickable upgrade entry
 * point" test (GROWTH-775). Separate from the `upgradeCtaPlacement` experiment so it can
 * run without disturbing that already-live experiment's buckets.
 *
 * `variant` is the resolved arm, gated on the experiment flag plus
 * `isPlanBadgeUpgradeEligible` — orgs that can't convert through the plan panel never
 * receive a variant, so the clickable badge never renders for them.
 *
 * First-paint correctness (mirrors `useUpgradeCtaExperiment`): PostHog flags are fetched
 * async on every load, so the variant is unknown at first paint. To avoid the badge's
 * affordance popping in or flashing, we persist the last resolved variant per org and seed
 * from it synchronously. The seed is used only until the live flag + org resolve, then the
 * live value takes over and is re-persisted — so it self-heals if anything changed. A
 * confirmed ineligible org always wins over a stale seed.
 *
 * Exposure tracking fires only once confirmed (eligible + in experiment) and only from the
 * call site passing `trackExposure`, so users who can never see the treatment — the mobile
 * sheets, and the `hidden md:flex` header below `md` — stay out of the cohort instead of
 * diluting both arms.
 */
export const usePlanBadgeUpgradeExperiment = ({
  trackExposure = true,
}: UsePlanBadgeUpgradeExperimentOptions = {}) => {
  const { slug } = useParams()
  const { data: organization, isPending: isOrgPending } = useSelectedOrganizationQuery()
  const flagStore = useFeatureFlags()
  const flagValue = usePHFlag<PlanBadgeUpgradeVariant | false>(PLAN_BADGE_UPGRADE_FLAG_NAME)
  const { billingAll } = useIsFeatureEnabled(['billing:all'])
  const { isLoading: isProfileLoading } = useProfile()

  const flagsLoaded = flagStore.hasLoaded === true
  const orgKnown = !isOrgPending
  // `billingAll` defaults to `true` while the profile is in flight, and the profile loads
  // independently of the org query. Without this the flag store can resolve first and enrol
  // a user whose `billing:all` is actually off.
  const featuresKnown = !isProfileLoading
  const isResolved = flagsLoaded && orgKnown && featuresKnown

  const isFreePlan = organization?.plan?.id === 'free'
  const isOrgUpgradable = isOrganizationUpgradableInDashboard(organization)
  const isEligible = isPlanBadgeUpgradeEligible(organization, billingAll)
  const isInExperiment =
    typeof flagValue === 'string' && VALID_VARIANTS.includes(flagValue as PlanBadgeUpgradeVariant)

  // The definitive variant for a confirmed eligible user in the experiment.
  const liveVariant =
    isResolved && isEligible && isInExperiment ? (flagValue as PlanBadgeUpgradeVariant) : undefined

  // Synchronous seed from the last resolved variant for this org. Read via useMemo so it
  // re-reads when the org slug changes (e.g. navigating between orgs without a remount).
  const seedKey = `${PLAN_BADGE_UPGRADE_SEED_PREFIX}${slug ?? 'none'}`
  const seededVariant = useMemo<PlanBadgeUpgradeVariant | null>(() => {
    const item = safeLocalStorage.getItem(seedKey)
    if (!item) return null
    try {
      const parsed = JSON.parse(item)
      return VALID_VARIANTS.includes(parsed) ? (parsed as PlanBadgeUpgradeVariant) : null
    } catch {
      return null
    }
  }, [seedKey])

  // Each "confirmed ineligible" branch is checked against the query that establishes it, so
  // a stale seed is beaten as soon as *that* answer lands rather than waiting for all of them.
  let variant: PlanBadgeUpgradeVariant | undefined
  if (!IS_PLATFORM) {
    // No billing/plans on self-hosted, so there is nothing to upgrade to — never show.
    variant = undefined
  } else if (isResolved) {
    // Fully resolved — source of truth.
    variant = liveVariant
  } else if (orgKnown && !isOrgUpgradable) {
    // Confirmed paid or partner-managed — never show, even if a stale seed says otherwise.
    variant = undefined
  } else if (featuresKnown && !billingAll) {
    // Confirmed no access to billing — same.
    variant = undefined
  } else {
    // Eligible, or still loading — trust the last known value to avoid a first-paint shift.
    variant = seededVariant ?? undefined
  }

  // Persist the last resolved variant once we have a definitive answer, so the next visit
  // to this org can seed from it. Only matters before the live value resolves, so we don't
  // need it in component state.
  useEffect(() => {
    if (!IS_PLATFORM || !isResolved) return
    safeLocalStorage.setItem(seedKey, JSON.stringify(liveVariant ?? null))
  }, [isResolved, liveVariant, seedKey])

  useTrackExperimentExposure(
    PLAN_BADGE_UPGRADE_EXPERIMENT_ID,
    trackExposure ? liveVariant : undefined
  )

  return { isFreePlan, isEligible, variant }
}
