import { IS_PLATFORM, safeLocalStorage, useFeatureFlags, useParams } from 'common'
import { useEffect, useMemo } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'

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
 * Shared experiment state for the "make the Free plan badge a clickable upgrade entry
 * point" test (GROWTH-775). Separate from the `upgradeCtaPlacement` experiment so it can
 * run without disturbing that already-live experiment's buckets.
 *
 * `variant` is the resolved arm, gated on a confirmed free plan + the experiment flag —
 * paid users never receive a variant, so the clickable badge never renders for them.
 *
 * First-paint correctness (mirrors `useUpgradeCtaExperiment`): PostHog flags are fetched
 * async on every load, so the variant is unknown at first paint. To avoid the badge's
 * affordance popping in or flashing, we persist the last resolved variant per org and seed
 * from it synchronously. The seed is used only until the live flag + plan resolve, then the
 * live value takes over and is re-persisted — so it self-heals if anything changed. A
 * confirmed paid plan always wins over a stale seed.
 *
 * Exposure tracking fires only once confirmed (free-plan + in experiment), so the
 * experiment cohort stays accurate (and includes the control arm for a baseline).
 */
export const usePlanBadgeUpgradeExperiment = () => {
  const { slug } = useParams()
  const { data: organization, isPending: isOrgPending } = useSelectedOrganizationQuery()
  const flagStore = useFeatureFlags()
  const flagValue = usePHFlag<PlanBadgeUpgradeVariant | false>(PLAN_BADGE_UPGRADE_FLAG_NAME)

  const flagsLoaded = flagStore.hasLoaded === true
  const planKnown = !isOrgPending
  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment =
    typeof flagValue === 'string' && VALID_VARIANTS.includes(flagValue as PlanBadgeUpgradeVariant)

  // The definitive variant for a confirmed free-plan user in the experiment.
  const liveVariant =
    isFreePlan && isInExperiment ? (flagValue as PlanBadgeUpgradeVariant) : undefined

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

  let variant: PlanBadgeUpgradeVariant | undefined
  if (!IS_PLATFORM) {
    // No billing/plans on self-hosted, so there is nothing to upgrade to — never show.
    variant = undefined
  } else if (flagsLoaded && planKnown) {
    // Fully resolved — source of truth.
    variant = liveVariant
  } else if (planKnown && !isFreePlan) {
    // Confirmed paid — never show, even if a stale seed says otherwise.
    variant = undefined
  } else {
    // Free, or still loading — trust the last known value to avoid a first-paint shift.
    variant = seededVariant ?? undefined
  }

  // Persist the last resolved variant once we have a definitive answer, so the next visit
  // to this org can seed from it. Only matters before the live value resolves, so we don't
  // need it in component state.
  useEffect(() => {
    if (!IS_PLATFORM || !flagsLoaded || !planKnown) return
    safeLocalStorage.setItem(seedKey, JSON.stringify(liveVariant ?? null))
  }, [flagsLoaded, planKnown, liveVariant, seedKey])

  useTrackExperimentExposure(PLAN_BADGE_UPGRADE_EXPERIMENT_ID, liveVariant)

  return { isFreePlan, variant }
}
