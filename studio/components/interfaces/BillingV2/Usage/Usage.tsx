import clsx from 'clsx'
import { useParams } from 'common'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Button, IconAlertCircle, IconLoader, Listbox } from 'ui'
import Activity from './Activity'
import Bandwidth from './Bandwidth'
import Infrastructure from './Infrastructure'
import SizeAndCounts from './SizeAndCounts'
import { USAGE_CATEGORIES, USAGE_STATUS } from './Usage.constants'
import { getUsageStatus } from './Usage.utils'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const Usage = () => {
  const { ref } = useParams()

  // [Joshen] Using a state here for now as in the future, we'd have this usage page support showing
  // stats for different projects. So we'll pass the selected ref as a prop into the individual components
  const [selectedProjectRef] = useState<string>(ref as string)

  const infrastructureRef = useRef<HTMLDivElement>(null)
  const bandwidthRef = useRef<HTMLDivElement>(null)
  const sizeAndCountsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)

  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription, isLoading: isLoadingSubscription } = useProjectSubscriptionV2Query({
    projectRef: selectedProjectRef,
  })

  const { current_period_start, current_period_end } = subscription ?? {}
  const startDate =
    current_period_start !== undefined
      ? new Date(current_period_start * 1000).toISOString()
      : undefined
  const endDate =
    current_period_end !== undefined ? new Date(current_period_end * 1000).toISOString() : undefined
  const { data: ioBudgetData } = useInfraMonitoringQuery({
    projectRef: selectedProjectRef,
    attribute: 'disk_io_budget',
    interval: '1d',
    startDate,
    endDate,
  })
  const currentDayIoBudget = Number(
    ioBudgetData?.data.find((x) => x.periodStartFormatted === dayjs().format('DD MMM'))?.[
      'disk_io_budget'
    ] ?? 100
  )

  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const usageBillingEnabled = subscription?.usage_billing_enabled

  const scrollTo = (id: 'infra' | 'bandwidth' | 'sizeCount' | 'activity') => {
    switch (id) {
      case 'infra':
        if (infrastructureRef.current)
          infrastructureRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'bandwidth':
        if (bandwidthRef.current) bandwidthRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'sizeCount':
        if (sizeAndCountsRef.current)
          sizeAndCountsRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'activity':
        if (activityRef.current) activityRef.current.scrollIntoView({ behavior: 'smooth' })
        break
    }
  }

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col px-5 lg:px-16 2xl:px-32 pt-6 space-y-4">
          <h3 className="text-scale-1200 text-xl">Usage</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Listbox
                disabled
                size="small"
                id="billingCycle"
                name="billingCycle"
                value={'current'}
                className="!w-[200px]"
                onChange={() => {}}
              >
                <Listbox.Option label="Current billing cycle" value="current">
                  Current billing cycle
                </Listbox.Option>
                <Listbox.Option label="Previous billing cycle" value="previous">
                  Previous billing cycle
                </Listbox.Option>
              </Listbox>
              {isLoadingSubscription ? (
                <IconLoader className="animate-spin" size={14} />
              ) : subscription !== undefined ? (
                <div>
                  <p className={clsx('text-sm transition', isLoadingSubscription && 'opacity-50')}>
                    Project is on {subscription.plan.name} plan
                  </p>
                  <p className="text-sm text-scale-1000">
                    {billingCycleStart.format('DD MMM YYYY')} -{' '}
                    {billingCycleEnd.format('DD MMM YYYY')}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center space-x-2">
              <Link href={`/project/${selectedProjectRef}/settings/billing/invoices`}>
                <a>
                  <Button type="default">View invoices</Button>
                </a>
              </Link>
              <Link href={`/project/${selectedProjectRef}/settings/billing/subscription`}>
                <a>
                  <Button type="default">View billing</Button>
                </a>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-6 !mt-2">
            {USAGE_CATEGORIES.map((category) => {
              const infraStatus =
                currentDayIoBudget <= 0
                  ? USAGE_STATUS.EXCEEDED
                  : currentDayIoBudget <= 20
                  ? USAGE_STATUS.APPROACHING
                  : USAGE_STATUS.NORMAL
              const status =
                category.key === 'infra' ? infraStatus : getUsageStatus(category.attributes, usage)

              return (
                <div
                  key={category.key}
                  onClick={() => scrollTo(category.key)}
                  className="flex items-center opacity-50 space-x-2 py-3 hover:opacity-100 transition cursor-pointer"
                >
                  {!usageBillingEnabled && status === USAGE_STATUS.APPROACHING ? (
                    <IconAlertCircle size={15} strokeWidth={2} className="text-amber-900" />
                  ) : !usageBillingEnabled && status === USAGE_STATUS.EXCEEDED ? (
                    <IconAlertCircle size={15} strokeWidth={2} className="text-red-900" />
                  ) : null}
                  <p className="text-sm">{category.name}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/*
        [Joshen] Could potentially run a map here based on USAGE_CATEGORIES, rather than defining each section
        but thinking it's gonna "cover up" too much details and make it harder to add attribute specific components
        e.g for database size, we also need to show disk volume size. Not to mention that are little nuances across
        each attribute RE formatting (bytes vs locale string)
      */}
      <div id="infrastructure" ref={infrastructureRef}>
        <Infrastructure projectRef={selectedProjectRef} />
      </div>
      <div id="bandwidth" ref={bandwidthRef}>
        <Bandwidth projectRef={selectedProjectRef} />
      </div>
      <div id="size_and_counts" ref={sizeAndCountsRef}>
        <SizeAndCounts projectRef={selectedProjectRef} />
      </div>
      <div id="activity" ref={activityRef}>
        <Activity projectRef={selectedProjectRef} />
      </div>
    </>
  )
}

export default Usage
