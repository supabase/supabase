import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import DateRangePicker from 'components/ui/DateRangePicker'
import NoPermission from 'components/ui/NoPermission'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import {
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Restriction } from '../BillingSettings/Restriction'
import Activity from './Activity'
import Compute from './Compute'
import Egress from './Egress'
import SizeAndCounts from './SizeAndCounts'
import { TotalUsage } from './TotalUsage'

export const Usage = () => {
  const { slug, projectRef } = useParams()
  const [dateRange, setDateRange] = useState<any>()
  const [selectedProjectRefInputValue, setSelectedProjectRefInputValue] = useState<
    string | undefined
  >('all-projects')

  // [Alaister] 'all-projects' is not a valid project ref, it's just used as an extra
  // state for the select input. As such we need to remove it for the selected project ref
  const selectedProjectRef =
    selectedProjectRefInputValue === 'all-projects' ? undefined : selectedProjectRefInputValue

  const { can: canReadSubscriptions, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  const { data: organization } = useSelectedOrganizationQuery()
  const { data, isSuccess } = useProjectsQuery()
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

  const orgProjects = (data?.projects ?? []).filter(
    (project) => project.organization_id === organization?.id
  )

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

  const selectedProject = selectedProjectRef
    ? orgProjects?.find((it) => it.ref === selectedProjectRef)
    : undefined

  useEffect(() => {
    if (projectRef && isSuccess && orgProjects !== undefined) {
      if (orgProjects.find((project) => project.ref === projectRef)) {
        setSelectedProjectRefInputValue(projectRef)
      }
    }
    // [Joshen] Since we're already looking at isSuccess
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRef, isSuccess])

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Usage</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <div className="sticky top-0 border-b bg-sidebar z-[1] overflow-hidden">
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

                  <Select_Shadcn_
                    value={selectedProjectRefInputValue}
                    onValueChange={(value) => {
                      if (value === 'all-projects') setSelectedProjectRefInputValue('all-projects')
                      else setSelectedProjectRefInputValue(value)
                    }}
                  >
                    <SelectTrigger_Shadcn_ size="tiny" className="w-[180px]">
                      <SelectValue_Shadcn_ placeholder="Select a project" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        <SelectItem_Shadcn_
                          key="all-projects"
                          value="all-projects"
                          className="text-xs"
                        >
                          All projects
                        </SelectItem_Shadcn_>
                        {orgProjects?.map((project) => (
                          <SelectItem_Shadcn_
                            key={project.ref}
                            value={project.ref}
                            className="text-xs"
                          >
                            {project.name}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
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

      {selectedProjectRef ? (
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
        <Compute
          orgSlug={slug as string}
          projectRef={selectedProjectRef}
          subscription={subscription}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      <Egress
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      <SizeAndCounts
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />

      <Activity
        orgSlug={slug as string}
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />
    </>
  )
}
