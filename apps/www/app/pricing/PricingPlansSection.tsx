'use client'

import PricingPlans from '~/components/Pricing/PricingPlans'
import { useOrganizations } from '~/data/organizations'
import { hasConsented, posthogClient } from 'common'
import { useEffect, useState } from 'react'

import type { PricingPageExperimentVariant } from './PricingContent'

const EXPERIMENT_ID = 'pricingPageExperiment' as const

const VALID_VARIANTS: PricingPageExperimentVariant[] = [
  'control',
  'flexibility',
  'flexibility_card',
  'hourly_rate',
  'multi_project',
  'estimate_cta',
]

export default function PricingPlansSection() {
  const { isLoading, organizations } = useOrganizations()
  const hasExistingOrganizations = !isLoading && organizations.length > 0

  // Pricing value/flexibility A/B experiment.
  // Uses client-side PostHog directly — server-side evaluation lacks full person context for www pages.
  // DevToolbar overrides (x-ph-flag-overrides cookie) are respected in local dev via posthogClient.getFeatureFlag.
  const [flagValue, setFlagValue] = useState<PricingPageExperimentVariant | false | undefined>(
    () =>
      posthogClient.getFeatureFlag(EXPERIMENT_ID) as
        | PricingPageExperimentVariant
        | false
        | undefined
  )

  useEffect(() => {
    return posthogClient.onFeatureFlags(() => {
      const value = posthogClient.getFeatureFlag(EXPERIMENT_ID)
      setFlagValue(value as PricingPageExperimentVariant | false | undefined)
    })
  }, [])

  const isInExperiment = VALID_VARIANTS.includes(flagValue as PricingPageExperimentVariant)
  const showFlexibilitySection = flagValue === 'flexibility'

  useEffect(() => {
    if (!isInExperiment) return

    posthogClient.captureExperimentExposure(EXPERIMENT_ID, { variant: flagValue }, hasConsented())
  }, [isInExperiment, flagValue])

  return (
    <>
      <PricingPlans
        organizations={organizations}
        hasExistingOrganizations={hasExistingOrganizations}
        experimentVariant={isInExperiment ? (flagValue as PricingPageExperimentVariant) : undefined}
      />

      {showFlexibilitySection && (
        <div className="mx-auto max-w-xl px-8 mt-10 xl:mt-16 text-center">
          <p className="text-foreground text-sm">
            Need more power for a launch? Scale up instantly.{' '}
            <span className="text-foreground-light">
              Scale back down after — you only pay for the hours you use.
            </span>
          </p>
        </div>
      )}
    </>
  )
}
