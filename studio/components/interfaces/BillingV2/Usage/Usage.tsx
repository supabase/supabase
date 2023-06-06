import clsx from 'clsx'
import { useParams } from 'common'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { InView } from 'react-intersection-observer'
import { Button, IconAlertCircle, IconLoader, Listbox } from 'ui'
import { cn } from 'ui/src/utils/cn'
import Activity from './Activity'
import Bandwidth from './Bandwidth'
import Infrastructure from './Infrastructure'
import SizeAndCounts from './SizeAndCounts'
import { USAGE_CATEGORIES, USAGE_STATUS } from './Usage.constants'
import { getUsageStatus } from './Usage.utils'

export type usageSectionIds = 'infra' | 'bandwidth' | 'sizeCount' | 'activity'

const Usage = () => {
  const { ref } = useParams()

  // [Joshen] Using a state here for now as in the future, we'd have this usage page support showing
  // stats for different projects. So we'll pass the selected ref as a prop into the individual components
  const [selectedProjectRef] = useState<string>(ref as string)

  const infrastructureRef = useRef<HTMLDivElement>(null)
  const bandwidthRef = useRef<HTMLDivElement>(null)
  const sizeAndCountsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)

  const [activeTab, setActiveTab] = useState<usageSectionIds>('infra')

  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription, isLoading: isLoadingSubscription } = useProjectSubscriptionV2Query({
    projectRef: selectedProjectRef,
  })

  const { current_period_start, current_period_end } = subscription ?? {}

  const startDate = useMemo(() => {
    return current_period_start ? new Date(current_period_start * 1000).toISOString() : undefined
  }, [current_period_start])

  const endDate =
    current_period_end !== undefined ? new Date(current_period_end * 1000).toISOString() : undefined

  const dailyStatsEndDate = useMemo(() => {
    // If end date is in future, set end date to now
    if (endDate && dayjs(endDate).isAfter(dayjs())) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date().toISOString().slice(0, -5) + 'Z'
    } else if (endDate) {
      return endDate
    }
  }, [endDate])

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

  const scrollTo = (id: usageSectionIds) => {
    switch (id) {
      case 'infra':
        if (infrastructureRef.current) {
          infrastructureRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // or 'end' to scroll to the bottom
            inline: 'start', //
          })
        }
        break
      case 'bandwidth':
        if (bandwidthRef.current) {
          bandwidthRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // or 'end' to scroll to the bottom
            inline: 'start', //
          })
        }
        break
      case 'sizeCount':
        if (sizeAndCountsRef.current) {
          sizeAndCountsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // or 'end' to scroll to the bottom
            inline: 'start', //
          })
        }
        break
      case 'activity':
        if (activityRef.current) {
          activityRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // or 'end' to scroll to the bottom
            inline: 'start', //
          })
        }
        break
    }
  }

  return (
    <>
      <div className="">
        <div className="1xl:px-28 mx-auto flex flex-col px-5 lg:px-16 2xl:px-32 pt-6 space-y-4">
          <h3 className="text-scale-1200 text-xl">Usage</h3>
        </div>
      </div>
      <div>
        <div className="sticky top-0 z-10 overflow-hidden bg-scale-200 border-b">
          <div className="1xl:px-28 mx-auto px-5 lg:px-16 2xl:px-32 flex flex-col gap-2">
            <div className="flex items-center mt-4 justify-between">
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
                  <div className="flex flex-col xl:flex-row xl:gap-3">
                    <p
                      className={clsx('text-sm transition', isLoadingSubscription && 'opacity-50')}
                    >
                      Project is on {subscription.plan.name}
                    </p>
                    <p className="text-sm text-scale-1000">
                      {billingCycleStart.format('DD MMM YYYY')} -{' '}
                      {billingCycleEnd.format('DD MMM YYYY')}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="items-center space-x-2 hidden lg:flex">
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
            <div className="flex gap-6">
              {USAGE_CATEGORIES.map((category) => {
                const infraStatus =
                  currentDayIoBudget <= 0
                    ? USAGE_STATUS.EXCEEDED
                    : currentDayIoBudget <= 20
                    ? USAGE_STATUS.APPROACHING
                    : USAGE_STATUS.NORMAL
                const status =
                  category.key === 'infra'
                    ? infraStatus
                    : getUsageStatus(category.attributes, usage)

                return (
                  <button
                    role="tab"
                    key={category.key}
                    onClick={() => scrollTo(category.key)}
                    className={cn(
                      'flex items-center space-x-2 py-3 hover:opacity-100 transition cursor-pointer',
                      activeTab === category.key
                        ? 'border-b border-scale-1200 text-scale-1200'
                        : 'opacity-50'
                    )}
                  >
                    {usageBillingEnabled === false && status === USAGE_STATUS.APPROACHING ? (
                      <IconAlertCircle size={15} strokeWidth={2} className="text-amber-900" />
                    ) : usageBillingEnabled === false && status === USAGE_STATUS.EXCEEDED ? (
                      <IconAlertCircle size={15} strokeWidth={2} className="text-red-900" />
                    ) : null}
                    <p className="text-sm">{category.name}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <InView as="div" threshold={0.2} onChange={(inView) => inView && setActiveTab('infra')}>
          <div id="infrastructure" ref={infrastructureRef} style={{ scrollMarginTop: '100px' }}>
            <Infrastructure projectRef={selectedProjectRef} />
          </div>
        </InView>
        <InView
          as="div"
          rootMargin="85% 0% -85% 0px"
          onChange={(inView) => inView && setActiveTab('bandwidth')}
        >
          <div id="bandwidth" ref={bandwidthRef} style={{ scrollMarginTop: '100px' }}>
            <Bandwidth
              projectRef={selectedProjectRef}
              subscription={subscription}
              startDate={startDate}
              endDate={dailyStatsEndDate}
            />
          </div>
        </InView>
        <InView
          as="div"
          rootMargin="85% 0% -85% 0px"
          onChange={(inView) => inView && setActiveTab('sizeCount')}
        >
          <div id="size_and_counts" ref={sizeAndCountsRef} style={{ scrollMarginTop: '100px' }}>
            <SizeAndCounts
              projectRef={selectedProjectRef}
              subscription={subscription}
              startDate={startDate}
              endDate={dailyStatsEndDate}
            />
          </div>
        </InView>
        <InView
          as="div"
          rootMargin="85% 0% -85% 0px"
          onChange={(inView) => inView && setActiveTab('activity')}
        >
          <div id="activity" ref={activityRef} style={{ scrollMarginTop: '100px' }}>
            <Activity
              projectRef={selectedProjectRef}
              subscription={subscription}
              startDate={startDate}
              endDate={dailyStatsEndDate}
            />
          </div>
        </InView>
      </div>
    </>
  )
}

export default Usage
