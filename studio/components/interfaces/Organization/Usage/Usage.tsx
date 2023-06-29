import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import Bandwidth from './Bandwidth'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants'
import SizeAndCounts from './SizeAndCounts'
import Activity from './Activity'

const Usage = () => {
  const { slug } = useParams()
  const [dateRange, setDateRange] = useState<any>()

  const selectedProjectRef = 'kojplftaeiavuneadgix'

  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    isError,
    isSuccess,
  } = useOrgSubscriptionQuery({ orgSlug: slug })

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

  return (
    <>
      <DateRangePicker
        id="billingCycle"
        name="billingCycle"
        onChange={setDateRange}
        value={TIME_PERIODS_BILLING[0].key}
        options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
        loading={isLoadingSubscription}
        currentBillingPeriodStart={subscription?.current_period_start}
        className="!w-[200px]"
      />
      <Bandwidth
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />
      <SizeAndCounts
        projectRef={selectedProjectRef}
        subscription={subscription}
        startDate={startDate}
        endDate={endDate}
        currentBillingCycleSelected={currentBillingCycleSelected}
      />
      <Activity
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
