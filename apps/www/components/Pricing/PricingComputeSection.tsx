'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/outline'
import { useWindowSize } from 'react-use'

import { Button, cn } from 'ui'
import Panel from '../Panel'
import ComputePricingTable from './ComputePricingTable'
import PricingComputeAnimation from './PricingComputeAnimation'
import ComputePricingCalculator from './ComputePricingCalculator'

const PricingComputeSection = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [showTable, setShowTable] = useState(false)
  const { width } = useWindowSize()
  const [height, setHeight] = useState(ref?.current?.clientHeight)

  useEffect(() => {
    setHeight(ref?.current?.clientHeight)
  }, [width])

  return (
    <Panel outerClassName="w-full mx-auto max-w-6xl" innerClassName="flex flex-col">
      <div className="flex flex-col xl:grid xl:grid-cols-3 xl:gap-4">
        <div className="p-4 pb-0 lg:p-8 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1">
                <span className="border bg-alternative px-3 py-0.5 text-foreground text-sm rounded-full">
                  Starts from <span translate="no">$10</span>/month
                </span>
              </div>
              <h3 className="text-foreground text-2xl">
                Scale compute up to
                <br className="hidden sm:block" /> 64 cores and 256 GB RAM
              </h3>
            </div>
            <p className="text-foreground-lighter text-[13px]">
              Paid Plans include <span translate="no">$10</span>/month in compute credits.
              Additional compute power is available if you need extra performance when scaling up
              Supabase.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button asChild size="tiny" type="default">
              <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
                Learn about Compute add-ons
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative col-span-2 h-full w-full p-4 lg:p-8">
          <ComputePricingCalculator />
        </div>
      </div>
      <hr className="border-0 border-t" />
      <div className="flex flex-col">
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
