import { IS_PLATFORM, safeLocalStorage, useFeatureFlags, useParams } from 'common'
import { useEffect, useMemo } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'

// PostHog flag key (camelCase, matches other flag naming in the codebase).
export const UPGRADE_CTA_FLAG_NAME = 'upgradeCtaPlacement'

// snake_case experiment ID so the auto-fired exposure event name matches the
// `[experiment_id]_experiment_exposed` typed event registered in telemetry-constants.ts.
const UPGRADE_CTA_EXPERIMENT_ID = 'upgrade_cta_placement'

// localStorage key prefix for the seeded variant (see hook docs). Keyed per org slug
// because eligibility folds in that org's plan.
const UPGRADE_CTA_SEED_PREFIX = 'supabase-upgrade-cta-variant-'

export type UpgradeCtaPlacement = 'control' | 'user_dropdown' | 'org_projects_list'

const VALID_VARIANTS: UpgradeCtaPlacement[] = ['control', 'user_dropdown', 'org_projects_list']

/**
 * Shared experiment state for the upgrade CTA placement test.
 *
 * `variant` is the placement to render, and is gated on a confirmed free plan + the
 * experiment flag — paid users never receive a variant, so the CTA never renders for them.
 *
 * First-paint correctness: PostHog flags are fetched async on every load, so the flag
 * (and therefore the variant) is unknown at first paint. To avoid the CTA popping in
 * (layout shift) or flashing, we persist the last resolved variant per org and seed from
 * it synchronously. The seed is used only until the live flag + plan resolve, then the
 * live value takes over and is re-persisted — so it self-heals if anything changed. A
 * confirmed paid plan always wins over a stale seed, so the CTA can't flash for paid users.
 *
 * Net effect: correct at first paint with no shift/flash on every visit after the first
 * (the first-ever visit to a given org still resolves async).
 *
 * Exposure tracking fires only once confirmed (free-plan + in experiment), so the
 * experiment cohort stays accurate.
 */
export const useUpgradeCtaExperiment = () => {
  const { slug } = useParams()
  const { data: organization, isPending: isOrgPending } = useSelectedOrganizationQuery()
  const flagStore = useFeatureFlags()
  const flagValue = usePHFlag<UpgradeCtaPlacement | false>(UPGRADE_CTA_FLAG_NAME)

  const flagsLoaded = flagStore.hasLoaded === true
  const planKnown = !isOrgPending
  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment =
    typeof flagValue === 'string' && VALID_VARIANTS.includes(flagValue as UpgradeCtaPlacement)

  // The definitive variant for a confirmed free-plan user in the experiment.
  const liveVariant = isFreePlan && isInExperiment ? (flagValue as UpgradeCtaPlacement) : undefined

  // Synchronous seed from the last resolved variant for this org. Read via useMemo so it
  // re-reads when the org slug changes (e.g. navigating between orgs without a remount).
  const seedKey = `${UPGRADE_CTA_SEED_PREFIX}${slug ?? 'none'}`
  const seededVariant = useMemo<UpgradeCtaPlacement | null>(() => {
    const item = safeLocalStorage.getItem(seedKey)
    if (!item) return null
    try {
      const parsed = JSON.parse(item)
      return VALID_VARIANTS.includes(parsed) ? (parsed as UpgradeCtaPlacement) : null
    } catch {
      return null
    }
  }, [seedKey])

  let variant: UpgradeCtaPlacement | undefined
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

  useTrackExperimentExposure(UPGRADE_CTA_EXPERIMENT_ID, liveVariant)

  return { isFreePlan, variant }
}
