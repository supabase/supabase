import { useMemo } from 'react'

import { isPartnerBillingOrganization } from '@/data/organizations/managed-by-utils'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import type { ManagedBy } from '@/lib/constants/infrastructure'

export type PlanPresentationVariant = 'control' | 'parity' | 'gaps'

const FLAG_KEY = 'pricingPanelPlanPresentation'
const EXPERIMENT_ID = 'pricing_panel_plan_presentation'

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

export function usePlanPresentationExperiment({
  eligible,
}: {
  eligible: boolean
}): PlanPresentationVariant {
  const flag = usePHFlag<'control' | 'parity' | 'gaps'>(FLAG_KEY)

  const isInExperiment = flag === 'control' || flag === 'parity' || flag === 'gaps'

  const variant: PlanPresentationVariant = useMemo(() => {
    if (!eligible || !isInExperiment) return 'control'
    return flag as PlanPresentationVariant
  }, [eligible, isInExperiment, flag])

  const liveVariant = eligible && isInExperiment ? variant : undefined
  useTrackExperimentExposure(EXPERIMENT_ID, liveVariant)

  return variant
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
