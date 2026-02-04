import { ArrowDownIcon } from '@heroicons/react/outline'
import { ArrowUpRight } from 'lucide-react'
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Button } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import DefaultLayout from '~/components/Layouts/Default'
import PricingPlans from '~/components/Pricing/PricingPlans'
import { useOrganizations } from '~/data/organizations'

const PricingComputeSection = dynamic(() => import('~/components/Pricing/PricingComputeSection'))
const PricingAddons = dynamic(() => import('~/components/Pricing/PricingAddons'))
const PricingComparisonTable = dynamic(() => import('~/components/Pricing/PricingComparisonTable'))
const PricingFAQs = dynamic(() => import('~/components/Pricing/PricingFAQs'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))
const PricingDiskSection = dynamic(() => import('~/components/Pricing/PricingDiskSection'))

export default function IndexPage() {
  const router = useRouter()
  const { asPath } = useRouter()

  const meta_title = 'Pricing & Fees | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing Plans, with no hidden pricing. We have a generous Free Plan for those getting started, and Pay As You Go for those scaling up.'

  // Ability to scroll into pricing sections like storage
  useEffect(() => {
    /**
     * As we render a mobile and a desktop row for each item and just display based on screen size, we cannot navigate by simple id hash
     * on both mobile and desktop. To handle both cases, we actually need to check screen size
     */

    const hash = asPath.split('#')[1]
    if (!hash) return

    let device = 'desktop'
    if (window.matchMedia('screen and (max-width: 1024px)').matches) {
      device = 'mobile'
    }

    const element = document.querySelector(`#${hash}-${device}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [asPath])

  const { isLoading, organizations } = useOrganizations()
  const hasExistingOrganizations = !isLoading && organizations.length > 0

  return (
    <DefaultLayout>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />

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
                Think of compute as the computer your database runs on. As your app grows, you scale
                CPU and memory to handle more traffic and data.
              </InfoTooltip>
            </span>
          </div>
        </div>
        <PricingComputeSection />
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
