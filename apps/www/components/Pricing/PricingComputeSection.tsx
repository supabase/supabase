'use client'

import { ChevronDownIcon } from '@heroicons/react/outline'
import React, { useState } from 'react'
import { plans as allPlans } from 'shared-data/plans'
import { Button, cn, ToggleGroup, ToggleGroupItem } from 'ui'

import Panel from '../Panel'
import ComputePricingCalculator from './ComputePricingCalculator'
import ComputePricingTable from './ComputePricingTable'
import PricingComputeAnimation from './PricingComputeAnimation'
import { Check } from './PricingIcons'

const plans = allPlans
  .filter((plan) => plan.planId === 'pro' || plan.planId === 'team')
  .map((plan) => ({
    name: plan.name,
    price: plan.priceMonthly as number,
  }))

const PLAN_HIGHLIGHTS: Record<string, { preface: string; features: string[] }> = {
  Pro: {
    preface: 'Everything in the Free Plan, plus:',
    features: [
      '100K monthly active users',
      '8 GB disk size per project',
      '250 GB bandwidth',
      'Daily backups (7 day retention)',
      'Email support',
    ],
  },
  Team: {
    preface: 'Everything in the Pro Plan, plus:',
    features: [
      'SOC2 & ISO 27001',
      'Project-scoped and read-only access',
      'HIPAA available as paid add-on',
      'SSO for Supabase Dashboard',
      'Priority email support & SLAs',
      'Daily backups (14 day retention)',
    ],
  },
}

const PricingComputeSection = () => {
  const [showTable, setShowTable] = useState(false)
  const [activePlan, setActivePlan] = useState(plans[0])

  const handleTableToggle = () => setShowTable((isShown) => !isShown)

  return (
    <Panel outerClassName="w-full mx-auto max-w-6xl" innerClassName="flex flex-col">
      <div className="flex flex-col xl:grid xl:grid-cols-3 xl:gap-4">
        <div className="p-4 pb-0 lg:p-8 gap-4 flex flex-col">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-foreground-light text-lg">1. Choose your plan</h3>
            <ToggleGroup
              type="single"
              variant="segmented"
              size="tiny"
              allowDeselect={false}
              aria-label="Plan"
              value={activePlan.name}
              onValueChange={(value) => {
                const selectedPlan = plans.find((p) => p.name === value)
                if (selectedPlan) setActivePlan(selectedPlan)
              }}
              className="bg-surface-200"
            >
              {plans.map((plan) => (
                <ToggleGroupItem key={plan.name} value={plan.name}>
                  {plan.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-3">
            <h3 className="text-foreground text-2xl font-medium">{activePlan.name}</h3>
            <div className="grid gap-1">
              <p className="text-foreground text-lg">
                <span className="font-mono font-bold">${activePlan.price}</span>
                <span className="text-foreground-light text-sm">/month </span>
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              {PLAN_HIGHLIGHTS[activePlan.name] ? (
                <>
                  <p className="text-foreground-light font-medium">
                    {PLAN_HIGHLIGHTS[activePlan.name].preface}
                  </p>
                  <ul className="grid gap-2">
                    {PLAN_HIGHLIGHTS[activePlan.name].features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-foreground-light">
                        <span className="flex h-lh shrink-0 items-center">
                          <Check className="size-5 -ml-0.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
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
            Add projects and adjust compute to estimate your monthly cost.
          </p>

          <ComputePricingCalculator activePlan={activePlan} />
        </div>
      </div>
      <div aria-hidden="true" className="h-0.5 groove" />
      <div className="flex flex-col">
        <div className="flex flex-col items-start md:flex-row gap-2 p-6 justify-between md:items-end mt-2">
          <div className="grid gap-2">
            <p className="text-foreground-light text-sm">
              Starts from <span translate="no">$10</span>/month
            </p>
            <h3 className="text-foreground text-2xl ml-0.5 md:ml-0 mb-2 md:mb-0">
              Scale compute up to
              <br className="hidden sm:block" /> 64 vCPUs and 256 GB RAM
            </h3>
          </div>

          <Button asChild size="tiny">
            <a href="https://supabase.com/docs/guides/platform/compute-add-ons">
              Learn about Compute add-ons
            </a>
          </Button>
        </div>
        <div className="relative">
          <div
            inert={!showTable}
            className={cn(
              'relative w-full overflow-hidden [interpolate-size:allow-keywords]',
              'transition-[max-height] duration-300 ease-out motion-reduce:transition-none',
              showTable ? 'max-h-max' : 'max-h-50'
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40',
                'bg-linear-to-t from-background-surface-100 to-transparent',
                'transition-opacity duration-300 ease-out motion-reduce:transition-none',
                showTable && 'opacity-0'
              )}
            />
            <ComputePricingTable />

            <div aria-hidden="true" className="h-0.5 groove" />
            <div className="grid lg:grid-cols-2 gap-4 md:gap-8 mt-4 md:mt-0">
              <div className="max-w-4xl prose p-4 pb-16 md:p-8 md:pb-20 relative z-10">
                <h4 className="text-lg font-medium">Choose the best compute size for you</h4>
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
                  <a
                    href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                    target="_blank"
                    className="transition text-primary hover:text-brand-600"
                  >
                    usage-based billing for compute
                  </a>{' '}
                  or{' '}
                  <a
                    href="https://supabase.com/docs/guides/platform/compute-add-ons"
                    target="_blank"
                    className="transition text-primary hover:text-brand-600"
                  >
                    Compute Add-ons
                  </a>
                  .
                </p>
              </div>
              <div className="relative -mt-8 lg:mt-0 z-0">
                <PricingComputeAnimation />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center">
            <button
              type="button"
              tabIndex={0}
              onClick={handleTableToggle}
              aria-expanded={showTable}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 text-xs text-foreground',
                'bg-surface-200/90 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm',
                'transition-[background-color,scale] duration-200 ease-out',
                'hover:bg-surface-300 active:scale-96 focus-ring'
              )}
            >
              <ChevronDownIcon
                aria-hidden="true"
                className={cn('size-3.5', showTable && 'rotate-180')}
              />
              {showTable ? 'Hide pricing breakdown' : 'Show pricing breakdown'}
            </button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default PricingComputeSection
