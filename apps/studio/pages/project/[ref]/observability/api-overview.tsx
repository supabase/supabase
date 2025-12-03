import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { useApiReport } from 'data/reports/api-report-query'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useCallback } from 'react'
import type { NextPageWithLayout } from 'types'

export const ApiReport: NextPageWithLayout = () => {
  const report = useApiReport()

  const {
    data,
    error,
    filters,
    isLoading,
    params,
    mergeParams,
    removeFilters,
    addFilter,
    refresh,
  } = report

  const {
    datePickerHelpers,
    datePickerValue,
    handleDatePickerChange: handleDatePickerChangeFromHook,
    showUpgradePrompt,
    setShowUpgradePrompt,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const handleDatepickerChange = useCallback(
    (vals: DatePickerValue) => {
      const promptShown = handleDatePickerChangeFromHook(vals)
      if (!promptShown) {
        mergeParams({
          iso_timestamp_start: vals.from ?? '',
          iso_timestamp_end: vals.to ?? '',
        })
      }
    },
    [handleDatePickerChangeFromHook, mergeParams]
  )

  const handleDatepickerChangeForRefresh = useCallback(
    (vals: DatePickerValue) => {
      handleDatePickerChangeFromHook(vals)
      mergeParams({
        iso_timestamp_start: vals.from ?? '',
        iso_timestamp_end: vals.to ?? '',
      })
      handleDatepickerChange(vals)
    },
    [handleDatePickerChangeFromHook, mergeParams, handleDatepickerChange]
  )

  const refreshWithParams = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    refresh()
  }, [refresh])

  const onRefreshReport = useCallback(async () => {
    if (datePickerValue.isHelper && datePickerValue.text) {
      const selectedHelper = datePickerHelpers.find((h) => h.text === datePickerValue.text)
      if (selectedHelper) {
        handleDatepickerChangeForRefresh({
          from: selectedHelper.calcFrom(),
          to: selectedHelper.calcTo(),
          isHelper: true,
          text: selectedHelper.text,
        })
      }
    }

    await refreshWithParams()
  }, [datePickerValue, datePickerHelpers, handleDatepickerChangeForRefresh, refreshWithParams])

  return (
    <ReportPadding>
      <ReportHeader title="API Gateway" showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="flex items-center gap-3">
            <ReportFilterBar
              onRemoveFilters={removeFilters}
              onDatepickerChange={handleDatepickerChange}
              datepickerFrom={params.totalRequests.iso_timestamp_start}
              datepickerTo={params.totalRequests.iso_timestamp_end}
              onAddFilter={addFilter}
              onRefresh={onRefreshReport}
              isLoading={isLoading}
              filters={filters}
              datepickerHelpers={datePickerHelpers}
              initialDatePickerValue={datePickerValue}
              className="w-full"
              showDatabaseSelector={false}
            />
            <UpgradePrompt
              show={showUpgradePrompt}
              setShowUpgradePrompt={setShowUpgradePrompt}
              title="Report date range"
              description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
              source="apiReportDateRange"
            />
          </div>
        }
      >
        <ReportWidget
          isLoading={isLoading}
          params={params.totalRequests}
          title="Total Requests"
          data={data.totalRequests || []}
          error={error.totalRequest}
          renderer={TotalRequestsChartRenderer}
          append={TopApiRoutesRenderer}
          appendProps={{ data: data.topRoutes || [], params: params.topRoutes }}
        />
        <ReportWidget
          isLoading={isLoading}
          params={params.errorCounts}
          title="Response Errors"
          tooltip="Error responses with 4XX or 5XX status codes"
          data={data.errorCounts || []}
          error={error.errorCounts}
          renderer={ErrorCountsChartRenderer}
          appendProps={{
            data: data.topErrorRoutes || [],
            params: params.topErrorRoutes,
          }}
          append={TopApiRoutesRenderer}
        />
        <ReportWidget
          isLoading={isLoading}
          params={params.responseSpeed}
          title="Response Speed"
          tooltip="Average response speed of a request (in ms)"
          data={data.responseSpeed || []}
          error={error.responseSpeed}
          renderer={ResponseSpeedChartRenderer}
          appendProps={{ data: data.topSlowRoutes || [], params: params.topSlowRoutes }}
          append={TopApiRoutesRenderer}
        />

        <ReportWidget
          isLoading={isLoading}
          params={params.networkTraffic}
          error={error.networkTraffic}
          title="Network Traffic"
          tooltip="Ingress and egress of requests and responses respectively"
          data={data.networkTraffic || []}
          renderer={NetworkTrafficRenderer}
        />
      </ReportStickyNav>
    </ReportPadding>
  )
}

ApiReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default ApiReport
