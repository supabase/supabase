import clsx from 'clsx'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants'
import { Button, IconExternalLink, IconInfo, Listbox } from 'ui'
import Activity from './Activity'
import Bandwidth from './Bandwidth'
import SizeAndCounts from './SizeAndCounts'
import InformationBox from 'components/ui/InformationBox'
import Link from 'next/link'

const Usage = () => {
  const { slug, projectRef } = useParams()
  const [dateRange, setDateRange] = useState<any>()
  const [selectedProjectRef, setSelectedProjectRef] = useState<string>()

  const organization = useSelectedOrganization()
  const { data: projects, isSuccess } = useProjectsQuery()
  const {
    data: subscription,
    error: subscriptionError,
    isLoading: isLoadingSubscription,
    isError: isErrorSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({ orgSlug: slug })
  const orgProjects = projects?.filter((project) => project.organization_id === organization?.id)

  useEffect(() => {
    if (projectRef && isSuccess && orgProjects !== undefined) {
      if (orgProjects.find((project) => project.ref === projectRef)) {
        setSelectedProjectRef(projectRef)
      }
    }
    // [Joshen] Since we're already looking at isSuccess
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRef, isSuccess])

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

  return (
    <>
      <ScaffoldContainer className="sticky top-0 border-b bg-scale-200 z-10 overflow-hidden">
        <div className="py-4 flex items-center space-x-4">
          {isLoadingSubscription && <ShimmeringLoader className="w-[250px]" />}

          {isErrorSubscription && (
            <AlertError
              className="w-full"
              subject="Failed to retrieve usage data"
              error={subscriptionError}
            />
          )}

          {isSuccessSubscription && (
            <>
              <DateRangePicker
                onChange={setDateRange}
                value={TIME_PERIODS_BILLING[0].key}
                options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
                loading={isLoadingSubscription}
                currentBillingPeriodStart={subscription?.current_period_start}
              />

              <Listbox
                size="tiny"
                name="schema"
                className="w-[180px]"
                value={selectedProjectRef}
                onChange={(value: any) => {
                  if (value === 'all-projects') setSelectedProjectRef(undefined)
                  else setSelectedProjectRef(value)
                }}
              >
                <Listbox.Option
                  key="all-projects"
                  id="all-projects"
                  label="All projects"
                  value="all-projects"
                >
                  All projects
                </Listbox.Option>
                {orgProjects?.map((project) => (
                  <Listbox.Option
                    key={project.ref}
                    id={project.ref}
                    value={project.ref}
                    label={project.name}
                  >
                    {project.name}
                  </Listbox.Option>
                ))}
              </Listbox>

              <div className="flex flex-col xl:flex-row xl:gap-3">
                <p className={clsx('text-sm transition', isLoadingSubscription && 'opacity-50')}>
                  Organization is on the {subscription.plan.name} plan
                </p>
                <p className="text-sm text-scale-1000">
                  {billingCycleStart.format('DD MMM YYYY')} -{' '}
                  {billingCycleEnd.format('DD MMM YYYY')}
                </p>
              </div>
            </>
          )}
        </div>
      </ScaffoldContainer>

      {selectedProjectRef && (
        <ScaffoldContainer className="mt-5">
          <InformationBox
            title="Usage filtered by project"
            description={
              <div className="space-y-3">
                <p>
                  You are currently viewing usage for the "
                  {selectedProject?.name || selectedProjectRef}" project. Since your organization is
                  using the new organization-based billing, the included quota is for your whole
                  organization and not just this project. For billing purposes, we sum up usage from
                  all your projects. To view your usage quota, set the project filter above back to
                  "All Projects".
                </p>
                <div>
                  <Link href="https://supabase.com/docs/guides/platform/org-based-billing">
                    <a target="_blank" rel="noreferrer">
                      <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        Documentation
                      </Button>
                    </a>
                  </Link>
                </div>
              </div>
            }
            defaultVisibility
            hideCollapse
            icon={<IconInfo />}
          />
        </ScaffoldContainer>
      )}

      <Bandwidth
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

export default Usage
