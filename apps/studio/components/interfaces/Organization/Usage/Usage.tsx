import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import {
  ScaffoldContainer,
  ScaffoldHeader,
  ScaffoldSection,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import DateRangePicker from 'components/ui/DateRangePicker'
import NoPermission from 'components/ui/NoPermission'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import dayjs from 'dayjs'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button, cn, CommandGroup_Shadcn_, CommandItem_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { Restriction } from '../BillingSettings/Restriction'
import ActiveCompute from './ActiveCompute'
import Activity from './Activity'
import Compute from './Compute'
import Egress from './Egress'
import OrgLogUsage from './OrgLogUsage'
import SizeAndCounts from './SizeAndCounts'
import { TotalUsage } from './TotalUsage'

export const Usage = () => {
  const { slug } = useParams()

  const [dateRange, setDateRange] = useState<any>()

  const [selectedProjectRef, setSelectedProjectRef] = useQueryState('projectRef')
  const [openProjectSelector, setOpenProjectSelector] = useState(false)

  const { can: canReadSubscriptions, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const {
    data: subscription,
    error: subscriptionError,
    isPending: isLoadingSubscription,
    isError: isErrorSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

  const { data: selectedProject } = useProjectDetailQuery({
    ref: selectedProjectRef ?? undefined,
  })

  const billingCycleStart = useMemo(() => {
    return dayjs.unix(subscription?.current_period_start ?? 0).utc()
  }, [subscription])

  const billingCycleEnd = useMemo(() => {
    return dayjs.unix(subscription?.current_period_end ?? 0).utc()
  }, [subscription])

  const currentBillingCycleSelected = useMemo(() => {
    // Selected by default
    if (!dateRange?.period_start || !dateRange?.period_end) return true

    return (
      dayjs(dateRange.period_start.date).isSame(billingCycleStart) &&
      dayjs(dateRange.period_end.date).isSame(billingCycleEnd)
    )
  }, [dateRange, billingCycleStart, billingCycleEnd])

  const startDate = useMemo(() => {
    // If end date is in future, set end date to now
    if (!dateRange?.period_start?.date) {
      return undefined
    } else {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange?.period_start?.date).toISOString().slice(0, -5) + 'Z'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, subscription])

  const {
    data: orgDailyStats,
    error: orgDailyStatsError,
    isPending: isLoadingOrgDailyStats,
    isError: isErrorOrgDailyStats,
  } = useOrgDailyStatsQuery({
    orgSlug: slug,
    projectRef: selectedProjectRef ?? undefined,
    startDate,
    endDate,
  })

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="pt-8">
          <ScaffoldTitle>Usage</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <div className="sticky top-0 border-b bg-sidebar z-[1]">
        <ScaffoldContainer>
          <div className="py-4 flex items-center space-x-4">
            {isLoadingSubscription || isLoadingPermissions ? (
              <div className="flex lg:items-center items-start gap-3 flex-col lg:flex-row lg:justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShimmeringLoader className="w-48" />
                  <ShimmeringLoader className="w-48" />
                </div>
                <ShimmeringLoader className="w-[280px]" />
              </div>
            ) : !canReadSubscriptions ? (
              <NoPermission resourceText="view organization usage" />
            ) : null}

            {isErrorSubscription && (
              <AlertError
                className="w-full"
                subject="Failed to retrieve usage data"
                error={subscriptionError}
              />
            )}

            {isSuccessSubscription && (
              <div className="flex lg:items-center items-start gap-3 flex-col lg:flex-row lg:justify-between w-full">
                <div className="flex items-center gap-2">
                  <DateRangePicker
                    onChange={setDateRange}
                    value={TIME_PERIODS_BILLING[0].key}
                    options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
                    loading={isLoadingSubscription}
                    currentBillingPeriodStart={subscription?.current_period_start}
                    currentBillingPeriodEnd={subscription?.current_period_end}
                    className="!w-48"
                  />

                  <OrganizationProjectSelector
                    open={openProjectSelector}
                    setOpen={setOpenProjectSelector}
                    selectedRef={selectedProjectRef}
                    onSelect={(project) => {
                      setSelectedProjectRef(project.ref)
                    }}
                    renderTrigger={({ listboxId, open }) => {
                      return (
                        <Button
                          block
                          type="default"
                          role="combobox"
                          size="tiny"
                          aria-expanded={open}
                          aria-controls={listboxId}
                          className="justify-between w-[180px]"
                          iconRight={<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                        >
                          {!selectedProject ? 'All projects' : selectedProject?.name}
                        </Button>
                      )
                    }}
                    renderRow={(project) => {
                      const isSelected = selectedProjectRef === project.ref
                      return (
                        <div className="w-full flex items-center justify-between">
                          <span className={cn('truncate', isSelected ? 'max-w-60' : 'max-w-64')}>
                            {project.name}
                          </span>
                          {isSelected && <Check size={16} />}
                        </div>
                      )
                    }}
                    renderActions={() => (
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          className="cursor-pointer flex items-center justify-between w-full"
                          onSelect={() => {
                            setOpenProjectSelector(false)
                            setSelectedProjectRef(null)
                          }}
                          onClick={() => {
                            setOpenProjectSelector(false)
                            setSelectedProjectRef(null)
                          }}
                        >
                          All projects
                          {!selectedProjectRef && <Check size={16} />}
                        </CommandItem_Shadcn_>
                      </CommandGroup_Shadcn_>
                    )}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <p className={cn('text-sm transition', isLoadingSubscription && 'opacity-50')}>
                    Organization is on the{' '}
                    <span className="font-medium text-brand">{subscription.plan.name} Plan</span>
                  </p>
                  <span className="text-border-stronger">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      shapeRendering="geometricPrecision"
                    >
                      <path d="M16 3.549L7.12 20.600" />
                    </svg>
                  </span>
                  <p className="text-sm text-foreground-light">
                    {billingCycleStart.format('DD MMM YYYY')} -{' '}
                    {billingCycleEnd.format('DD MMM YYYY')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScaffoldContainer>
      </div>

      {isErrorOrgDailyStats && (
        <ScaffoldContainer>
          <ScaffoldSection isFullWidth className="pb-0">
            <AlertError
              error={orgDailyStatsError}
              subject="Failed to retrieve usage statistics for organization"
            />
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      {selectedProject ? (
        <ScaffoldContainer className="mt-5">
          <Admonition
            type="default"
            title="Usage filtered by project"
            description={
              <div>
                You are currently viewing usage for the{' '}
                <span className="font-medium text-foreground">
                  {selectedProject?.name || selectedProjectRef}
                </span>{' '}
                project. Supabase uses{' '}
                <Link
                  href="/docs/guides/platform/billing-on-supabase#organization-based-billing"
                  target="_blank"
                >
                  organization-level billing
                </Link>{' '}
                and quotas. For billing purposes, we sum up usage from all your projects. To view
                your usage quota, set the project filter above back to "All Projects".
              </div>
            }
          />
        </ScaffoldContainer>
      ) : (
        <ScaffoldContainer id="restriction" className="mt-5">
          <Restriction />
        </ScaffoldContainer>
      )}

      <TotalUsage
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      {subscription?.plan.id !== 'free' && (
        <Compute orgDailyStats={orgDailyStats} isLoadingOrgDailyStats={isLoadingOrgDailyStats} />
      )}

      {subscription?.plan.id === 'platform' && (
        <ActiveCompute
          orgDailyStats={orgDailyStats}
          isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        />
      )}

      <Egress
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        currentBillingCycleSelected={currentBillingCycleSelected}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        startDate={startDate}
        endDate={endDate}
      />

      <SizeAndCounts
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        currentBillingCycleSelected={currentBillingCycleSelected}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        startDate={startDate}
        endDate={endDate}
      />

      <Activity
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
        orgDailyStats={orgDailyStats}
        isLoadingOrgDailyStats={isLoadingOrgDailyStats}
      />

      {subscription?.plan.id === 'platform' && (
        <OrgLogUsage
          orgSlug={slug as string}
          projectRef={selectedProjectRef}
          subscription={subscription}
          startDate={startDate}
          endDate={endDate}
          currentBillingCycleSelected={currentBillingCycleSelected}
          orgDailyStats={orgDailyStats}
          isLoadingOrgDailyStats={isLoadingOrgDailyStats}
        />
      )}
    </>
  )
}
