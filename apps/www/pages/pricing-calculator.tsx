import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowDownIcon } from '@heroicons/react/outline'

import { Button } from 'ui'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import Logos from '~/components/logos'
import PricingCalculator from '~/components/PricingCalculator/PricingCalculator'

export default function PricingCalculatorPage() {
  const router = useRouter()

  const meta_title = 'Pricing Calculator | Supabase'
  const meta_description =
    'Estimate your Supabase bill in 60 seconds. Compare alternatives and generate a shareable report you can send to your team.'

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

      <SectionContainer className="!pb-8 md:!pb-12 !pt-10 md:!pt-14">
        <div className="mx-auto max-w-3xl text-center flex flex-col items-center gap-4">
          <h1 className="h1">Know your costs before you build</h1>
          <p className="text-foreground-light text-lg">
            Estimate your Supabase bill in 60 seconds. See how much you save compared to Firebase,
            Auth0, and self-hosted alternatives.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              asChild
              size="large"
              type="primary"
              iconRight={<ArrowDownIcon className="w-4" />}
            >
              <Link href="#calculator">Calculate my costs</Link>
            </Button>
            <p className="text-foreground-lighter text-sm">
              No signup required. Get a shareable report.
            </p>
          </div>
        </div>
      </SectionContainer>

      <div className="pb-6 md:pb-10">
        <Logos showHeading />
      </div>

      <SectionContainer className="!py-10 md:!py-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-foreground text-3xl">Four stages to your estimate</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="p-5 flex flex-col gap-2"
            >
              <p className="text-foreground text-sm font-medium">Stage 1: Project basics</p>
              <p className="text-foreground-lighter text-sm">
                Number of environments, team size, and where you&apos;re coming from.
              </p>
            </Panel>
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="p-5 flex flex-col gap-2"
            >
              <p className="text-foreground text-sm font-medium">Stage 2: Usage estimation</p>
              <p className="text-foreground-lighter text-sm">
                Database size, monthly users, bandwidth, and realtime needs.
              </p>
            </Panel>
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="p-5 flex flex-col gap-2"
            >
              <p className="text-foreground text-sm font-medium">Stage 3: Growth projections</p>
              <p className="text-foreground-lighter text-sm">
                See how costs change over 12 or 36 months as you grow.
              </p>
            </Panel>
            <Panel
              hasActiveOnHover
              outerClassName="h-full"
              innerClassName="p-5 flex flex-col gap-2"
            >
              <p className="text-foreground text-sm font-medium">
                Stage 4: Time allocation (optional)
              </p>
              <p className="text-foreground-lighter text-sm">
                Add detail to value analysis by estimating time spent on infrastructure today.
              </p>
            </Panel>
          </div>
        </div>
      </SectionContainer>

      <SectionContainer id="calculator" className="!pt-10 md:!pt-12">
        <PricingCalculator />
      </SectionContainer>
    </DefaultLayout>
  )
}
