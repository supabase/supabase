import clsx from 'clsx'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { useMemo, useRef, useState } from 'react'
import { InView } from 'react-intersection-observer'
import { Button, cn, IconAlertCircle, IconExternalLink, IconInfo, IconLoader } from 'ui'

import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import InformationBox from 'components/ui/InformationBox'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useSelectedOrganization } from 'hooks'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants'
import Link from 'next/link'
import Activity from './Activity'
import Bandwidth from './Bandwidth'
import Infrastructure from './Infrastructure'
import SizeAndCounts from './SizeAndCounts'
import { USAGE_CATEGORIES, USAGE_STATUS } from './Usage.constants'
import { getUsageStatus } from './Usage.utils'

type UsageSectionIds = 'infra' | 'bandwidth' | 'sizeCount' | 'activity'

const Usage = () => {
  const { ref } = useParams()
  const organization = useSelectedOrganization()
  const isOrgBilling = !!organization?.subscription_id

  // [Joshen] Using a state here for now as in the future, we'd have this usage page support showing
  // stats for different projects. So we'll pass the selected ref as a prop into the individual components
  const [selectedProjectRef] = useState<string>(ref as string)
  const [activeTab, setActiveTab] = useState<UsageSectionIds>('infra')
  const [dateRange, setDateRange] = useState<any>()

  const infrastructureRef = useRef<HTMLDivElement>(null)
  const bandwidthRef = useRef<HTMLDivElement>(null)
  const sizeAndCountsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)

  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription, isLoading: isLoadingSubscription } = useProjectSubscriptionV2Query({
    projectRef: selectedProjectRef,
  })
  const usageBillingEnabled = subscription?.usage_billing_enabled
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const currentBillingCycleSelected = useMemo(() => {
    // Selected by default
    if (!dateRange?.period_start || !dateRange?.period_end || !subscription) return true

    const { current_period_start, current_period_end } = subscription

    return (
      dayjs(dateRange.period_start.date).isSame(new Date(current_period_start * 1000)) &&
      dayjs(dateRange.period_end.date).isSame(new Date(current_period_end * 1000))
    )
  }, [dateRange, subscription])

  const startDate = useMemo(() => {
    // If end date is in future, set end date to now
    if (!dateRange?.period_start?.date) {
      return undefined
    } else {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange?.period_start?.date).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  const endDate = useMemo(() => {
    // If end date is in future, set end date to end of current day
    if (dateRange?.period_end?.date && dayjs(dateRange.period_end.date).isAfter(dayjs())) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      // In order to have full days from Prometheus metrics when using 1d interval,
      // the time needs to be greater or equal than the time of the start date
      return dayjs().endOf('day').toISOString().slice(0, -5) + 'Z'
    } else if (dateRange?.period_end?.date) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange.period_end.date).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  const { data: ioBudgetData } = useInfraMonitoringQuery({
    projectRef: selectedProjectRef,
    attribute: 'disk_io_budget',
    interval: '1d',
    startDate: dateRange?.period_start?.date,
    endDate: dateRange?.period_end?.date,
  })
  const currentDayIoBudget = Number(
    ioBudgetData?.data.find((x) => x.periodStartFormatted === dayjs().format('DD MMM'))?.[
      'disk_io_budget'
    ] ?? 100
  )

  const scrollTo = (id: UsageSectionIds) => {
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
      <div>
        <div className="1xl:px-28 mx-auto flex flex-col px-5 lg:px-16 2xl:px-32 pt-6 space-y-4">
          <h3 className="text-foreground text-xl">{isOrgBilling ? 'Project ' : ''}Usage</h3>
        </div>
      </div>
      <div>
        <div className="sticky top-0 z-10 overflow-hidden bg-scale-200 border-b">
          <div className="1xl:px-28 mx-auto px-5 lg:px-16 2xl:px-32 flex flex-col gap-2">
            <div className="flex items-center mt-4 justify-between">
              <div className="flex items-center space-x-4">
                {!isLoadingSubscription && (
                  <DateRangePicker
                    onChange={setDateRange}
                    value={TIME_PERIODS_BILLING[0].key}
                    options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
                    loading={isLoadingSubscription}
                    currentBillingPeriodStart={subscription?.current_period_start}
                  />
                )}

                {isLoadingSubscription ? (
                  <IconLoader className="animate-spin" size={14} />
                ) : subscription !== undefined ? (
                  <div className="flex flex-col xl:flex-row xl:gap-3">
                    <p
                      className={clsx('text-sm transition', isLoadingSubscription && 'opacity-50')}
                    >
                      {isOrgBilling ? 'Organization' : 'Project'} is on the {subscription.plan.name}{' '}
                      plan
                    </p>
                    <p className="text-sm text-foreground-light">
                      {billingCycleStart.format('DD MMM YYYY')} -{' '}
                      {billingCycleEnd.format('DD MMM YYYY')}
                    </p>
                  </div>
                ) : null}
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
                        ? 'border-b border-scale-1200 text-foreground'
                        : 'opacity-50'
                    )}
                  >
                    {currentBillingCycleSelected &&
                    usageBillingEnabled === false &&
                    status === USAGE_STATUS.APPROACHING ? (
                      <IconAlertCircle size={15} strokeWidth={2} className="text-amber-900" />
                    ) : currentBillingCycleSelected &&
                      usageBillingEnabled === false &&
                      status === USAGE_STATUS.EXCEEDED ? (
                      <IconAlertCircle size={15} strokeWidth={2} className="text-red-900" />
                    ) : null}
                    <p className="text-sm">{category.name}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 pt-8">
          <InformationBox
            icon={<IconInfo size="large" strokeWidth={1.5} />}
            defaultVisibility={true}
            hideCollapse
            title="We're upgrading our billing system"
            description={
              <div className="space-y-3">
                <p className="text-sm leading-normal">
                  This organization uses the legacy project-based billing. We’ve recently made some
                  big improvements to our billing system. To migrate to the new organization-based
                  billing, head over to your{' '}
                  <Link href={`/org/${organization?.slug}/billing`}>
                    <a className="text-sm text-green-900 transition hover:text-green-1000">
                      organization billing settings
                    </a>
                  </Link>
                  .
                </p>

                <div className="space-x-3">
                  <Link href="https://supabase.com/blog/organization-based-billing" passHref>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a target="_blank" rel="noreferrer">
                        Announcement
                      </a>
                    </Button>
                  </Link>
                  <Link href="https://supabase.com/docs/guides/platform/org-based-billing" passHref>
                    <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                      <a target="_blank" rel="noreferrer">
                        Documentation
                      </a>
                    </Button>
                  </Link>
                </div>
              </div>
            }
          />
        </div>

        <InView as="div" threshold={0.2} onChange={(inView) => inView && setActiveTab('infra')}>
          <div id="infrastructure" ref={infrastructureRef} style={{ scrollMarginTop: '100px' }}>
            <Infrastructure
              projectRef={selectedProjectRef}
              startDate={startDate}
              endDate={endDate}
              currentBillingCycleSelected={currentBillingCycleSelected}
            />
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
              endDate={endDate}
              currentBillingCycleSelected={currentBillingCycleSelected}
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
              endDate={endDate}
              currentBillingCycleSelected={currentBillingCycleSelected}
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
              endDate={endDate}
              currentBillingCycleSelected={currentBillingCycleSelected}
            />
          </div>
        </InView>
      </div>
    </>
  )
}

export default Usage
