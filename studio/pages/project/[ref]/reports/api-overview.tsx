import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { Presets, ReportFilterItem } from 'components/interfaces/Reports/Reports.types'
import { ReportsLayout } from 'components/layouts'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import {
  renderTotalRequests,
  renderErrorCounts,
  renderResponseSpeed,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import { useState, useEffect } from 'react'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import { DatePickerToFrom, LogsEndpointParams } from 'components/interfaces/Settings/Logs'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
export const ApiReport: NextPageWithLayout = () => {
  const report = useApiReport()
  const handleDatepickerChange = (value: DatePickerToFrom) => {}

  return (
    <div className="flex flex-col gap-4 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
      <ReportHeader
        title="API Performance"
        isLoading={report.isLoading}
        onRefresh={report.refresh}
      />

      <ReportFilterBar
        onDatepickerChange={handleDatepickerChange}
        datepickerFrom={report.params.totalRequests.iso_timestamp_start}
        datepickerTo={report.params.totalRequests.iso_timestamp_end}
        onAddFilter={report.addFilter}
        onRemoveFilter={report.removeFilter}
        filters={report.filters}
      />

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.totalRequests}
        title="Total Requests"
        data={report.data.totalRequests || []}
        renderer={renderTotalRequests}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.errorCounts}
        title="Response Errors"
        tooltip="Error responses with 4XX or 5XX status codes"
        data={report.data.errorCounts || []}
        renderer={renderErrorCounts}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.responseSpeed}
        title="Response Speed"
        tooltip="Average response speed (in miliseconds) of a request"
        data={report.data.responseSpeed || []}
        renderer={renderResponseSpeed}
      />
    </div>
  )
}

// hook to fetch data
const useApiReport = () => {
  const queryHooks = queriesFactory<keyof typeof PRESET_CONFIG.api.queries>(
    PRESET_CONFIG.api.queries
  )
  const totalRequests = queryHooks.totalRequests()
  const errorCounts = queryHooks.errorCounts()
  const responseSpeed = queryHooks.responseSpeed()
  const activeHooks = [totalRequests, errorCounts, responseSpeed]
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const addFilter = (filter: ReportFilterItem) => {
    if (filters.includes(filter)) return
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
  const removeFilter = (filter: ReportFilterItem) => {
    setFilters((prev) => prev.filter((f) => f !== filter))
  }

  useEffect(() => {
    // update sql for each query
    if (totalRequests[1].changeQuery) {
      totalRequests[1].changeQuery(PRESET_CONFIG.api.queries.totalRequests.sql(filters))
    }
    if (errorCounts[1].changeQuery) {
      errorCounts[1].changeQuery(PRESET_CONFIG.api.queries.errorCounts.sql(filters))
    }
    if (responseSpeed[1].changeQuery) {
      responseSpeed[1].changeQuery(PRESET_CONFIG.api.queries.responseSpeed.sql(filters))
    }
  }, [JSON.stringify(filters)])

  const handleRefresh = () => {
    activeHooks.forEach(([_hookData, hookHandler]) => {
      hookHandler.runQuery()
    })
  }
  const handleSetParams = (params: LogsEndpointParams) => {
    activeHooks.forEach(([_hookData, hookHandler]) => {
      hookHandler.setParams?.((prev) => ({ ...prev, ...params }))
    })
  }
  const isLoading = activeHooks.some(([hookData]) => hookData.isLoading)
  return {
    data: {
      totalRequests: totalRequests[0].logData,
      errorCounts: errorCounts[0].logData,
      responseSpeed: responseSpeed[0].logData,
    },
    params: {
      totalRequests: totalRequests[0].params,
      errorCounts: errorCounts[0].params,
      responseSpeed: responseSpeed[0].params,
    },
    setParams: handleSetParams,
    filters,
    addFilter,
    removeFilter,
    isLoading,
    refresh: handleRefresh,
  }
}

ApiReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(ApiReport)
