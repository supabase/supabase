import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Button, IconArrowUpRight } from 'ui'
import { ArrowDownIcon } from '@heroicons/react/outline'
import ReactTooltip from 'react-tooltip'

import DefaultLayout from '~/components/Layouts/Default'
import PricingPlans from '~/components/Pricing/PricingPlans'

const PricingComputeSection = dynamic(() => import('~/components/Pricing/PricingComputeSection'))
const PricingAddons = dynamic(() => import('~/components/Pricing/PricingAddons'))
const PricingComparisonTable = dynamic(() => import('~/components/Pricing/PricingComparisonTable'))
const PricingFAQs = dynamic(() => import('~/components/Pricing/PricingFAQs'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

export default function IndexPage() {
  const router = useRouter()
  const { asPath } = useRouter()
  const [mounted, setMounted] = useState(false)

  const meta_title = 'Pricing & Fees | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing plans, with no hidden pricing. We have a generous free plan for those getting started, and Pay As You Go for those scaling up.'

  useEffect(() => {
    setTimeout(() => {
      setMounted(true)
    }, 200)
  }, [])

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
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
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
              Start building for free, collaborate with a team, then scale to millions of users.
            </p>
          </div>
        </div>
      </div>

      <PricingPlans />

      <div className="text-center mt-10 xl:mt-16 mx-auto max-w-lg flex flex-col gap-8">
        <p className="text-foreground-lighter">
          We will only bill extra for resources consumed
          <br className="hidden md:block" /> exceeding the inclusive quota limits in your paid plan
        </p>
        <div className="flex justify-center gap-2">
          <a href="#compare-plans">
            <Button size="tiny" type="secondary" iconRight={<ArrowDownIcon className="w-3" />}>
              Compare Plans
            </Button>
          </a>
          <Button
            size="tiny"
            type="default"
            asChild
            iconRight={<IconArrowUpRight className="w-4" />}
          >
            <a href="/docs/guides/platform/org-based-billing" target="_blank">
              Learn how billing works
            </a>
          </Button>
        </div>
      </div>

      <div
        id="addon-compute"
        className="container relative mx-auto px-4 lg:px-12 pt-16 md:pt-24 lg:pt-32 lg:pb-16"
      >
        <PricingComputeSection />
      </div>

      <div id="addons" className="sm:py-18 container relative mx-auto px-4 py-16 md:py-24 lg:px-12">
        <PricingAddons />
      </div>

      <PricingComparisonTable />

      <div id="faq" className="border-t">
        <PricingFAQs />
      </div>
      <CTABanner />
      {mounted && (
        <ReactTooltip
          wrapper="span"
          effect="solid"
          backgroundColor="hsl(var(--background-alternative-default))"
          textColor="hsl(var(--foreground-light))"
          className="!max-w-[320px] !px-3 whitespace-pre-line"
          uuid="pricing-tt"
        />
      )}
    </DefaultLayout>
  )
}
