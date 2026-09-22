import { IS_PLATFORM, useFeatureFlags } from 'common'
import { useMemo } from 'react'

import { isPartnerBillingOrganization } from '@/data/organizations/managed-by-utils'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import type { ManagedBy } from '@/lib/constants/infrastructure'

export const PLAN_PRESENTATION_VARIANTS = [
  'control',
  'parity',
  'gaps',
  'fullscreen',
  'fullscreen-gaps',
] as const

export type PlanPresentationVariant = (typeof PLAN_PRESENTATION_VARIANTS)[number]

const FLAG_KEY = 'pricingPanelPlanPresentation'
const EXPERIMENT_ID = 'pricing_panel_plan_presentation'

interface PlanPresentation {
  /** `control` is the original compact card; `parity` is the richer card. */
  cards: 'control' | 'parity'
  /** `sheet` is the SidePanel; `fullscreen` is a full-screen overlay. */
  shell: 'sheet' | 'fullscreen'
  /** Whether cards list what the plan is missing ("Not included" / "Plan limits"). */
  showsGaps: boolean
}

const PLAN_PRESENTATIONS: Record<PlanPresentationVariant, PlanPresentation> = {
  control: { cards: 'control', shell: 'sheet', showsGaps: false },
  parity: { cards: 'parity', shell: 'sheet', showsGaps: false },
  gaps: { cards: 'parity', shell: 'sheet', showsGaps: true },
  fullscreen: { cards: 'parity', shell: 'fullscreen', showsGaps: false },
  'fullscreen-gaps': { cards: 'parity', shell: 'fullscreen', showsGaps: true },
}

export function parsePlanPresentationVariant(
  flag: string | boolean | undefined
): PlanPresentationVariant | undefined {
  return PLAN_PRESENTATION_VARIANTS.find((variant) => variant === flag)
}

export function isParityPresentation(variant: PlanPresentationVariant): boolean {
  return PLAN_PRESENTATIONS[variant].cards === 'parity'
}

export function isFullScreenPresentation(variant: PlanPresentationVariant): boolean {
  return PLAN_PRESENTATIONS[variant].shell === 'fullscreen'
}

export function hasPlanGaps(variant: PlanPresentationVariant): boolean {
  return PLAN_PRESENTATIONS[variant].showsGaps
}

export function isPlanChangeEligible({
  managedBy,
  billingPartner,
  currentPlanId,
  canUpdateSubscription,
}: {
  managedBy: ManagedBy | undefined
  billingPartner: string | null | undefined
  currentPlanId: string | undefined
  canUpdateSubscription: boolean
}): boolean {
  if (managedBy === MANAGED_BY.STRIPE_PROJECTS) return false
  if (managedBy === MANAGED_BY.AWS_MARKETPLACE) return false
  if (isPartnerBillingOrganization(billingPartner)) return false
  if (currentPlanId === 'enterprise' || currentPlanId === 'platform') return false
  if (!canUpdateSubscription) return false
  return true
}

export interface PlanPresentationExperiment {
  variant: PlanPresentationVariant
  /**
   * False while PostHog flags are still in flight. The `fullscreen` variant swaps the whole panel
   * shell, so callers must wait rather than open the control sheet and swap it out mid-animation.
   */
  isResolved: boolean
}

export function usePlanPresentationExperiment({
  eligible,
}: {
  eligible: boolean
}): PlanPresentationExperiment {
  const { hasLoaded } = useFeatureFlags()
  const flag = usePHFlag<PlanPresentationVariant>(FLAG_KEY)

  const assignedVariant = useMemo(() => parsePlanPresentationVariant(flag), [flag])

  const liveVariant = eligible ? assignedVariant : undefined
  useTrackExperimentExposure(EXPERIMENT_ID, liveVariant)

  return {
    variant: liveVariant ?? 'control',
    isResolved: !IS_PLATFORM || !!hasLoaded,
  }
}

export interface GapFeature {
  label: string
  type: 'missing' | 'lesser'
}

export const FREE_PLAN_GAPS: GapFeature[] = [
  { label: 'Daily backups', type: 'missing' },
  { label: 'Email support', type: 'missing' },
  { label: '1-day log retention', type: 'lesser' },
]

export const PRO_PLAN_GAPS: GapFeature[] = [
  { label: 'SOC2 & ISO 27001', type: 'missing' },
  { label: 'SSO for Supabase Dashboard', type: 'missing' },
  { label: 'Priority email support & SLAs', type: 'missing' },
]
