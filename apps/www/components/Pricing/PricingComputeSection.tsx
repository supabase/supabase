import React, { useEffect, useRef, useState } from 'react'
import Panel from '../Panel'
import { Button, cn } from 'ui'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/outline'
import ComputePricingTable from './ComputePricingTable'
import { useWindowSize } from 'react-use'

const PricingComputeSection = () => {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [showTable, setShowTable] = useState(false)
  const { width } = useWindowSize()
  const [height, setHeight] = useState(ref?.current?.clientHeight)

  useEffect(() => {
    setHeight(ref?.current?.clientHeight)
  }, [width])

  return (
    <Panel outerClassName="w-full mx-auto max-w-6xl" innerClassName="flex flex-col gap-4">
      <div className="grid lg:grid-cols-2 lg:gap-8">
        <div className="p-4 lg:p-8 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center h-12 w-12 bg-alternative rounded-lg mb-3">
                <svg
                  width="25"
                  height="24"
                  viewBox="0 0 25 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.7075 8.99963H6.4232V14.9996M20 16.7328V20C20 20.5523 19.5523 21 19 21H6C5.44772 21 5 20.5523 5 20V16C5 15.4477 5.44772 15 6 15H13.5937M12.8637 9H6C5.44772 9 5 8.55229 5 8V4C5 3.44772 5.44772 3 6 3H19C19.5523 3 20 3.44772 20 4V7.99585M14.0817 17.2045V11.1907H10.7459L16.9259 4.92151L20.0159 8.05613L23.1059 11.1907H20.0033V18M16.9077 11.9619V18.7052"
                    stroke="hsl(var(--brand-default))"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-brand text-sm">Optimized compute</p>
              <h3 className="text-foreground text-2xl">
                Scale each project
                <br className="hidden md:block" /> up to 256 GB compute
              </h3>
            </div>
            <p className="text-foreground-lighter text-[13px]">
              Paid plans include one Starter instance for free, additional compute add-ons are
              available if you need extra performance when scaling up Supabase.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button asChild size="tiny" type="default">
              <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
                Learn about compute
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative h-full w-full">
          <Image
            fill
            src={`/images/pricing/compute-${
              resolvedTheme?.includes('dark') ? 'dark' : 'light'
            }.svg`}
            alt="Compute addon illustration"
            className="object-contain object-center p-4 lg:p-8"
          />
        </div>
      </div>
      <hr className="mx-4 border-0 border-t" />
      <div className="flex flex-col">
        <div
          className="relative w-full overflow-hidden transition-all !ease-[.76,0,.23,1] duration-300"
          style={{ height: showTable ? `${height}px` : '200px' }}
        >
          <div
            className={cn(
              'absolute inset-0 top-auto w-full h-40 bg-gradient-to-t from-background-surface-100 z-20 to-transparent transition-opacity pointer-events-none not-sr-only',
              showTable ? 'opacity-0 delay-200' : 'opacity-100'
            )}
          />
          <div ref={ref} className="pb-4 lg:pb-0">
            <ComputePricingTable />

            <div className="grid md:grid-cols-2 gap-4 md:gap-8 p-4 mt-4 md:mt-0 md:p-8">
              <div className="max-w-4xl prose">
                <h4 className="text-lg">Choose best compute setup for you</h4>
                <p className="text-sm">
                  Every project on the Supabase Platform comes with its own dedicated Postgres
                  instance running inside a virtual machine (VM). The table above describes the base
                  instance with additional compute add-ons available if you need extra performance
                  when scaling up Supabase.
                </p>
                <p className="text-sm">
                  Compute instances are billed hourly and you can scale up or down at any time.
                  You'll only be charged at the end of the month for the hours you've used. Paid
                  plans come with $10 in Compute Credits per month to cover one Starter instance or
                  parts of any other instance.
                </p>
                <p className="text-sm">
                  Read more on{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
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
