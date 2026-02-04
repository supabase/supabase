import { ChevronDownIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { useWindowSize } from 'react-use'
import { plans as allPlans } from 'shared-data/plans'
import { Button, cn } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import Panel from '../Panel'
import ComputePricingCalculator from './ComputePricingCalculator'
import ComputePricingTable from './ComputePricingTable'
import PricingComputeAnimation from './PricingComputeAnimation'
import { ToggleGroup, ToggleGroupItem } from 'ui/src/components/shadcn/ui/toggle-group'

const plans = allPlans
  .filter((plan) => plan.planId === 'pro' || plan.planId === 'team')
  .map((plan) => ({
    name: plan.name,
    price: plan.priceMonthly as number,
  }))

const PricingComputeSection = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [showTable, setShowTable] = useState(false)
  const { width } = useWindowSize()
  const [height, setHeight] = useState(ref?.current?.clientHeight)
  const [activePlan, setActivePlan] = useState(plans[0])

  useEffect(() => {
    setHeight(ref?.current?.clientHeight)
  }, [width])

  return (
    <Panel outerClassName="w-full mx-auto max-w-6xl" innerClassName="flex flex-col">
      <div className="flex flex-col xl:grid xl:grid-cols-3 xl:gap-4">
        <div className="p-4 pb-0 lg:p-8 gap-4 flex flex-col">
          <div className="mb-4 grid gap-1">
            <h3 className="text-foreground-light text-lg">1. Choose your plan</h3>
          </div>
          <ToggleGroup
            type="single"
            value={activePlan.name}
            onValueChange={(value) => {
              const selectedPlan = plans.find((p) => p.name === value)
              if (selectedPlan) setActivePlan(selectedPlan)
            }}
            className="grid grid-cols-2 gap-2 w-full bg-surface-200 rounded-md"
          >
            {plans.map((plan) => (
              <ToggleGroupItem
                key={plan.name}
                value={plan.name}
                className={cn(
                  'w-full h-6 ',
                  activePlan.name === plan.name
                    ? 'bg-surface-200 text-foreground data-[state=on]:bg-surface-400 data-[state=on]:text-foreground'
                    : 'hover:bg-surface-200'
                )}
              >
                {plan.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="grid gap-3">
            <h3 className="text-foreground text-2xl font-medium">{activePlan.name}</h3>
            <div className="grid gap-1">
              <p className="text-foreground text-lg">
                <span className="font-mono font-bold">${activePlan.price}</span>
                <span className="text-foreground-light text-sm">/month </span>
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              {activePlan.name === 'Pro' && (
                <>
                  <p className="text-foreground-light font-medium">
                    Everything in the Free Plan, plus:
                  </p>
                  <p className="text-foreground-light">100K monthly active users</p>
                  <p className="text-foreground-light">8 GB disk size per project</p>
                  <p className="text-foreground-light">250 GB bandwidth</p>
                  <p className="text-foreground-light">Daily backups (7 day retention)</p>
                  <p className="text-foreground-light">Email support</p>
                </>
              )}
              {activePlan.name === 'Team' && (
                <>
                  <p className="text-foreground-light font-medium">
                    Everything in the Pro Plan, plus:
                  </p>
                  <p className="text-foreground-light">SOC2</p>
                  <p className="text-foreground-light">Project-scoped and read-only access</p>
                  <p className="text-foreground-light">HIPAA available as paid add-on</p>
                  <p className="text-foreground-light">SSO for Supabase Dashboard</p>
                  <p className="text-foreground-light">Priority email support & SLAs</p>
                  <p className="text-foreground-light">Daily backups (14 day retention)</p>
                </>
              )}
              <p className="text-foreground-lighter text-xs mt-2">
                Paid plans include $10/mo in compute credits, enough to cover one Micro instance.
              </p>
            </div>
          </div>
        </div>
        <div className="relative col-span-2 h-full w-full p-4 lg:p-8">
          <h3 className="text-foreground-light text-lg mb-2">
            2. Configure compute for your projects
          </h3>
          <p className="text-foreground-lighter text-xs mb-6">
            Paid plans can have unlimited projects. Pay only for compute usage (from{' '}
            <span translate="no">$10</span>/month for Micro).
          </p>

          <ComputePricingCalculator activePlan={activePlan} />
        </div>
      </div>
      <hr className="border-0 border-t" />
      <div className="flex flex-col">
        <div className="flex gap-2 p-6 justify-between items-center mt-2">
          <div className="grid gap-2">
            <p>
              <span className="border bg-alternative px-3 py-0.5 text-foreground text-sm rounded-full">
                Starts from <span translate="no">$10</span>/month
              </span>
            </p>
            <h3 className="text-foreground text-2xl">
              Scale compute up to
              <br className="hidden sm:block" /> 64 cores and 256 GB RAM
            </h3>
          </div>

          <Button asChild size="tiny" type="default">
            <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
              Learn about Compute add-ons
            </Link>
          </Button>
        </div>
        <div
          className="relative w-full overflow-hidden transition-all !ease-[cubic-bezier(.76,0,.23,1)] duration-300"
          style={{ height: showTable ? `${height}px` : '200px' }}
        >
          <div
            className={cn(
              'absolute inset-0 top-auto w-full h-40 bg-gradient-to-t from-background-surface-100 z-20 to-transparent transition-opacity pointer-events-none not-sr-only',
              showTable ? 'opacity-0 delay-200' : 'opacity-100'
            )}
          />
          <div ref={ref}>
            <ComputePricingTable />

            <div className="grid lg:grid-cols-2 gap-4 md:gap-8 mt-4 md:mt-0 border-t">
              <div className="max-w-4xl prose p-4 md:p-8 relative z-10">
                <h4 className="text-lg">Choose the best compute size for you</h4>
                <p className="text-[13px] text-foreground-lighter">
                  Every project on the Supabase Platform comes with its own dedicated Postgres
                  instance. Select the compute size that fits your needs.
                </p>
                <p className="text-[13px] text-foreground-lighter">
                  Compute instances are billed hourly and you can scale up or down at any time. Paid
                  Plans come with <span translate="no">$10</span>/month in compute credits to cover
                  one Micro instance or offset the cost of any other instance.
                </p>
                <p className="text-[13px] text-foreground-lighter">
                  Read more on{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                    target="_blank"
                    className="transition text-brand hover:text-brand-600"
                  >
                    usage-based billing for compute
                  </Link>{' '}
                  or{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform/compute-add-ons"
                    target="_blank"
                    className="transition text-brand hover:text-brand-600"
                  >
                    Compute Add-ons
                  </Link>
                  .
                </p>
              </div>
              <div className="relative -mt-8 lg:mt-0 z-0">
                <PricingComputeAnimation />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full p-2 border-t border-muted text-foreground focus-visible:outline-brand-600 focus-visible:rounded-b-xl text-sm bg-alternative flex items-center justify-center gap-2"
        >
          <ChevronDownIcon
            className={cn(
              'w-4 transition-transform transform origin-center',
              showTable ? 'rotate-180' : 'rotate-0'
            )}
          />{' '}
          {!showTable ? 'Expand' : 'Hide'} Pricing breakdown
        </button>
      </div>
    </Panel>
  )
}

export default PricingComputeSection
