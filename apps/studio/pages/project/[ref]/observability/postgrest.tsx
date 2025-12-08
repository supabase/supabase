import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import {
  DatePickerValue,
  LogsDatePicker,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useReportDateRange, useRefreshHandler } from 'hooks/misc/useReportDateRange'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'

import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import { SharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
import { useSharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import type { NextPageWithLayout } from 'types'
import { ObservabilityLink } from 'components/ui/ObservabilityLink'

const PostgRESTReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <PostgrestReport />
    </ReportPadding>
  )
}

PostgRESTReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="PostgREST">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default PostgRESTReport

const PostgrestReport = () => {
  const { db, chart } = useParams()
  const {
    selectedDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange: handleDatePickerChangeFromHook,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
    filters,
    addFilter,
    removeFilters,
    isLoadingData,
    sql,
  } = useSharedAPIReport({
    filterBy: 'postgrest',
    start: selectedDateRange?.period_start?.date,
    end: selectedDateRange?.period_end?.date,
  })

  const state = useDatabaseSelectorStateSnapshot()

  const hasStateSyncedFromUrlRef = useRef(false)
  useEffect(() => {
    if (hasStateSyncedFromUrlRef.current) return
    hasStateSyncedFromUrlRef.current = true

    if (db !== undefined) {
      setTimeout(() => {
        // [Joshen] Adding a timeout here to support navigation from settings to reports
        // Both are rendering different instances of ProjectLayout which is where the
        // DatabaseSelectorContextProvider lies in (unless we reckon shifting the provider up one more level is better)
        state.setSelectedDatabaseId(db)
      }, 100)
    }
    if (chart !== undefined) {
      setTimeout(() => {
        const el = document.getElementById(chart)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
  }, [state, db, chart])

  const handleDatePickerChange = (values: DatePickerValue) => {
    handleDatePickerChangeFromHook(values)
  }

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    refetch
  )

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title="Data API" />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <ButtonTooltip
                type="default"
                disabled={isRefetching}
                icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
              />
              <UpgradePrompt
                show={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                title="Report date range"
                description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
                source="postgrestReportDateRange"
              />
              {selectedDateRange && (
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
            <ReportFilterBar
              filters={filters}
              onAddFilter={addFilter}
              onRemoveFilters={removeFilters}
              isLoading={isLoadingData || isRefetching}
              hideDatepicker={true}
              datepickerHelpers={datePickerHelpers}
              selectedProduct={'postgrest'}
              showDatabaseSelector={false}
            />
          </div>
        }
      >
        <div className="relative mt-8">
          <SharedAPIReport
            data={data}
            error={error}
            isLoading={isLoading}
            isRefetching={isRefetching}
            sql={sql}
          />
        </div>
      </ReportStickyNav>
      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}
