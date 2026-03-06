'use client'

import { ArrowDownIcon } from '@heroicons/react/outline'
import DefaultLayout from '~/components/Layouts/Default'
import PricingPlans from '~/components/Pricing/PricingPlans'
import { useOrganizations } from '~/data/organizations'
import { hasConsented, posthogClient } from 'common'
import { ArrowUpRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

const EXPERIMENT_ID = 'pricingCalculatorExperiment' as const
type PricingCalculatorVariant = 'control' | 'test'

const NewPricingComputeSection = dynamic(
  () => import('~/components/Pricing/NewPricingComputeSection')
)
const PricingComputeSection = dynamic(() => import('~/components/Pricing/PricingComputeSection'))
const PricingAddons = dynamic(() => import('~/components/Pricing/PricingAddons'))
const PricingComparisonTable = dynamic(() => import('~/components/Pricing/PricingComparisonTable'))
const PricingFAQs = dynamic(() => import('~/components/Pricing/PricingFAQs'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))
const PricingDiskSection = dynamic(() => import('~/components/Pricing/PricingDiskSection'))

export default function PricingContent() {
  const pathname = usePathname()

  // Ability to scroll into pricing sections like storage
  useEffect(() => {
    /**
     * As we render a mobile and a desktop row for each item and just display based on screen size, we cannot navigate by simple id hash
     * on both mobile and desktop. To handle both cases, we actually need to check screen size
     */

    const hash = window.location.hash.slice(1)
    if (!hash) return

    let device = 'desktop'
    if (window.matchMedia('screen and (max-width: 1024px)').matches) {
      device = 'mobile'
    }

    const element = document.querySelector(`#${hash}-${device}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pathname])

  const { isLoading, organizations } = useOrganizations()
  const hasExistingOrganizations = !isLoading && organizations.length > 0

  // Pricing calculator A/B experiment
  // Uses client-side PostHog directly — server-side evaluation lacks full person context for www pages.
  // DevToolbar overrides (x-ph-flag-overrides cookie) are respected in local dev via posthogClient.getFeatureFlag.
  const [flagValue, setFlagValue] = useState<PricingCalculatorVariant | false | undefined>(
    () =>
      posthogClient.getFeatureFlag(EXPERIMENT_ID) as PricingCalculatorVariant | false | undefined
  )

  useEffect(() => {
    return posthogClient.onFeatureFlags(() => {
      const value = posthogClient.getFeatureFlag(EXPERIMENT_ID)
      setFlagValue(value as PricingCalculatorVariant | false | undefined)
    })
  }, [])

  const isTestVariant = flagValue === 'test'
  const isInExperiment = flagValue === 'control' || flagValue === 'test'

  useEffect(() => {
    if (!isInExperiment) return

    posthogClient.captureExperimentExposure(EXPERIMENT_ID, { variant: flagValue }, hasConsented())
  }, [isInExperiment, flagValue])

  return (
    <DefaultLayout>
      <div className="relative z-10 pt-8 pb-4 xl:py-16">
        <div className="mx-auto max-w-7xl px-8 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-2 lg:max-w-none">
            <h1 className="h1">
              Predictable pricing,
              <br className="block lg:hidden" /> designed to scale
            </h1>
            <p className="p text-lg leading-5">
              Start building for free, collaborate with your team, then scale to millions of users
            </p>
          </div>
        </div>
      </div>

      <PricingPlans
        organizations={organizations}
        hasExistingOrganizations={hasExistingOrganizations}
      />

      <div className="text-center mt-10 xl:mt-16 mx-auto max-w-lg flex flex-col gap-8">
        <div className="flex justify-center gap-2">
          <a href="#compare-plans">
            <Button size="tiny" type="secondary" iconRight={<ArrowDownIcon className="w-3" />}>
              Compare Plans
            </Button>
          </a>
          <Button size="tiny" type="default" asChild iconRight={<ArrowUpRight className="w-4" />}>
            <a
              href="/docs/guides/platform/billing-on-supabase#organization-based-billing"
              target="_blank"
            >
              Learn how billing works
            </a>
          </Button>
        </div>
      </div>

      <div
        id="addon-compute"
        className="container relative mx-auto px-4 lg:px-12 pt-16 md:pt-24 lg:pt-32 lg:pb-16"
      >
        {isTestVariant && (
          <div className="text-center mb-8 lg:mb-16">
            <h2 className="text-foreground text-3xl" id="how-compute-pricing-works">
              How compute pricing works
            </h2>
            <p className="text-foreground-light mt-4 text-lg mb-4">
              Choose a plan, add projects, and see your total cost
            </p>
            <div className="flex items-center justify-center gap-1">
              <span className="py-1 px-3 bg-surface-100 flex items-center gap-1 border rounded-full text-xs text-foreground-lighter">
                What is &ldquo;compute&rdquo;?
                <InfoTooltip side="bottom" className="max-w-[280px]">
                  Think of compute as the computer your database runs on. As your app grows, you
                  scale CPU and memory to handle more traffic and data.
                </InfoTooltip>
              </span>
            </div>
          </div>
        )}

        {isTestVariant ? <NewPricingComputeSection /> : <PricingComputeSection />}
      </div>

      <div
        id="disk"
        className="container relative mx-auto px-4 lg:px-12 pt-16 md:pt-24 lg:pt-32 lg:pb-16"
      >
        <PricingDiskSection />
      </div>

      <div id="addons" className="sm:py-18 container relative mx-auto px-4 py-16 md:py-24 lg:px-12">
        <PricingAddons />
      </div>

      <PricingComparisonTable
        organizations={organizations}
        hasExistingOrganizations={hasExistingOrganizations}
      />

      <div id="faq" className="border-t">
        <PricingFAQs />
      </div>
      <CTABanner />
    </DefaultLayout>
  )
}
