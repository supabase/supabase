import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ReportFilterItem } from 'components/interfaces/Reports/Reports.types'
import { ReportsLayout } from 'components/layouts'
import {
  PRESET_CONFIG,
  REPORTS_DATEPICKER_HELPERS,
} from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import {
  TotalRequestsChartRenderer,
  ErrorCountsChartRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  NetworkTrafficRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import { useState, useEffect } from 'react'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { DatePickerToFrom, LogsEndpointParams } from 'components/interfaces/Settings/Logs'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import { useParams } from 'common'
import { isEqual } from 'lodash'
import ShimmerLine from 'components/ui/ShimmerLine'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

export const ApiReport: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const report = useApiReport()

  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const plan = subscription?.plan

  const handleDatepickerChange = ({ from, to }: DatePickerToFrom) => {
    report.mergeParams({
      iso_timestamp_start: from || '',
      iso_timestamp_end: to || '',
    })
  }

  return (
    <ReportPadding>
      <ReportHeader title="API" isLoading={report.isLoading} onRefresh={report.refresh} />
      <div className="w-full flex flex-col gap-1">
        <ReportFilterBar
          onRemoveFilters={report.removeFilters}
          onDatepickerChange={handleDatepickerChange}
          datepickerFrom={report.params.totalRequests.iso_timestamp_start}
          datepickerTo={report.params.totalRequests.iso_timestamp_end}
          onAddFilter={report.addFilter}
          filters={report.filters}
          datepickerHelpers={REPORTS_DATEPICKER_HELPERS.map((helper, index) => ({
            ...helper,
            disabled: (index > 0 && plan?.id === 'free') || (index > 1 && plan?.id !== 'pro'),
          }))}
        />
        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
        </div>
      </div>

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.totalRequests}
        title="Total Requests"
        data={report.data.totalRequests || []}
        renderer={TotalRequestsChartRenderer}
        append={TopApiRoutesRenderer}
        appendProps={{ data: report.data.topRoutes || [] }}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.errorCounts}
        title="Response Errors"
        tooltip="Error responses with 4XX or 5XX status codes"
        data={report.data.errorCounts || []}
        renderer={ErrorCountsChartRenderer}
        appendProps={{ data: report.data.topErrorRoutes || [] }}
        append={TopApiRoutesRenderer}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.responseSpeed}
        title="Response Speed"
        tooltip="Average response speed (in miliseconds) of a request"
        data={report.data.responseSpeed || []}
        renderer={ResponseSpeedChartRenderer}
        appendProps={{ data: report.data.topSlowRoutes || [] }}
        append={TopApiRoutesRenderer}
      />

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.networkTraffic}
        title="Network Traffic"
        tooltip="Ingress and egress of requests and responses respectively"
        data={report.data.networkTraffic || []}
        renderer={NetworkTrafficRenderer}
      />
    </ReportPadding>
  )
}

// hook to fetch data
const useApiReport = () => {
  const { ref: projectRef } = useParams()

  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.api.queries>(
    PRESET_CONFIG.api.queries,
    projectRef ?? 'default'
  )
  const totalRequests = queryHooks.totalRequests()
  const topRoutes = queryHooks.topRoutes()
  const errorCounts = queryHooks.errorCounts()
  const topErrorRoutes = queryHooks.topErrorRoutes()
  const responseSpeed = queryHooks.responseSpeed()
  const topSlowRoutes = queryHooks.topSlowRoutes()
  const networkTraffic = queryHooks.networkTraffic()
  const activeHooks = [
    totalRequests,
    topRoutes,
    errorCounts,
    topErrorRoutes,
    responseSpeed,
    topSlowRoutes,
    networkTraffic,
  ]
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const addFilter = (filter: ReportFilterItem) => {
    // use a deep equal when comparing objects.
    if (filters.some((f) => isEqual(f, filter))) return
    setFilters((prev) =>
      [...prev, filter].sort((a, b) => {
        const keyA = a.key.toLowerCase()
        const keyB = b.key.toLowerCase()
        if (keyA < keyB) {
          return -1
        }
        if (keyA > keyB) {
          return 1
        }
        return 0
      })
    )
  }
  const removeFilter = (filter: ReportFilterItem) => removeFilters([filter])
  const removeFilters = (toRemove: ReportFilterItem[]) => {
    setFilters((prev) => {
      return prev.filter((f) => !toRemove.find((r) => isEqual(f, r)))
    })
  }

  useEffect(() => {
    // update sql for each query
    if (totalRequests.changeQuery) {
      totalRequests.changeQuery(PRESET_CONFIG.api.queries.totalRequests.sql(filters))
    }
    if (topRoutes.changeQuery) {
      topRoutes.changeQuery(PRESET_CONFIG.api.queries.topRoutes.sql(filters))
    }
    if (errorCounts.changeQuery) {
      errorCounts.changeQuery(PRESET_CONFIG.api.queries.errorCounts.sql(filters))
    }

    if (topErrorRoutes.changeQuery) {
      topErrorRoutes.changeQuery(PRESET_CONFIG.api.queries.topErrorRoutes.sql(filters))
    }
    if (responseSpeed.changeQuery) {
      responseSpeed.changeQuery(PRESET_CONFIG.api.queries.responseSpeed.sql(filters))
    }

    if (topSlowRoutes.changeQuery) {
      topSlowRoutes.changeQuery(PRESET_CONFIG.api.queries.topSlowRoutes.sql(filters))
    }

    if (networkTraffic.changeQuery) {
      networkTraffic.changeQuery(PRESET_CONFIG.api.queries.networkTraffic.sql(filters))
    }
  }, [JSON.stringify(filters)])

  const handleRefresh = async () => {
    activeHooks.forEach((hook) => hook.runQuery())
  }
  const handleSetParams = (params: Partial<LogsEndpointParams>) => {
    activeHooks.forEach((hook) => {
      hook.setParams?.((prev: LogsEndpointParams) => ({ ...prev, ...params }))
    })
  }
  const isLoading = activeHooks.some((hook) => hook.isLoading)
  return {
    data: {
      totalRequests: totalRequests.logData,
      errorCounts: errorCounts.logData,
      responseSpeed: responseSpeed.logData,
      topRoutes: topRoutes.logData,
      topErrorRoutes: topErrorRoutes.logData,
      topSlowRoutes: topSlowRoutes.logData,
      networkTraffic: networkTraffic.logData,
    },
    params: {
      totalRequests: totalRequests.params,
      errorCounts: errorCounts.params,
      responseSpeed: responseSpeed.params,
      topRoutes: topRoutes.params,
      topErrorRoutes: topErrorRoutes.params,
      topSlowRoutes: topSlowRoutes.params,
      networkTraffic: networkTraffic.params,
    },
    mergeParams: handleSetParams,
    filters,
    addFilter,
    removeFilter,
    removeFilters,
    isLoading,
    refresh: handleRefresh,
  }
}

ApiReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiReport)
