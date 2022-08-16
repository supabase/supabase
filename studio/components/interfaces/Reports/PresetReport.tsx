import {
  Button,
  Collapsible,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconRefreshCw,
} from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import Panel from 'components/ui/Panel'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useState } from 'react'
import { DatePickerToFrom } from '../Settings/Logs'
import DatePickers from '../Settings/Logs/Logs.DatePickers'
import { jsonSyntaxHighlight } from '../Settings/Logs/LogsFormatters'
import { renderRequestsPathsTable, renderStatusCodesChart } from './renderers/OverviewRenderers'
import { DATETIME_FORMAT, PRESET_CONFIG, REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import { Presets } from './Reports.types'
import ReportWidget from './ReportWidget'

interface Props {
  preset: Presets
  projectRef: string
}

const DEFAULT_PARAMS = {
  iso_timestamp_start: REPORTS_DATEPICKER_HELPERS[0].calcFrom(),
  iso_timestamp_end: REPORTS_DATEPICKER_HELPERS[0].calcTo(),
}

const PresetReport: React.FC<Props> = ({ projectRef, preset }) => {
  const config = PRESET_CONFIG[preset]
  const [statusCodes, statusCodesHandlers] = useLogsQuery(projectRef, {
    sql: config.sql.statusCodes,
    ...DEFAULT_PARAMS,
  })

  const [requestPaths, requestPathsHandlers] = useLogsQuery(projectRef, {
    sql: config.sql.requestPaths,
    ...DEFAULT_PARAMS,
  })

  const handleRefresh = () => {
    statusCodesHandlers.runQuery()
    requestPathsHandlers.runQuery()
  }
  const handleDatepickerChange = ({ to, from }: DatePickerToFrom) => {
    const newParams = { iso_timestamp_start: from || '', iso_timestamp_end: to || '' }
    statusCodesHandlers.setParams((prev) => ({ ...prev, ...newParams }))
    requestPathsHandlers.setParams((prev) => ({ ...prev, ...newParams }))
  }
  const isLoading = statusCodes.isLoading || requestPaths.isLoading

  return (
    <div className="mx-auto flex flex-col gap-4 px-5 lg:px-16 xl:px-24 1xl:px-28 2xl:px-32 py-6">
      <h1 className="text-2xl text-scale-1200">{config.title}</h1>
      <div className="flex flex-row justify-between">
        <DatePickers
          onChange={handleDatepickerChange}
          to={statusCodes.params.iso_timestamp_end || ''}
          from={statusCodes.params.iso_timestamp_end || ''}
          helpers={REPORTS_DATEPICKER_HELPERS}
        />
        <Button
          type="default"
          size="tiny"
          onClick={handleRefresh}
          disabled={isLoading ? true : false}
          icon={
            <IconRefreshCw
              size="tiny"
              className={`text-scale-1100 ${isLoading ? 'animate-spin' : ''}`}
            />
          }
        >
          Refresh
        </Button>
      </div>

      <div className="grid  lg:grid-cols-4">
        <ReportWidget
          isLoading={isLoading}
          params={statusCodes.params}
          className="col-span-4 col-start-1"
          title="API Status Codes"
          description="Distrubution of API reponses by status codes."
          data={statusCodes.logData}
          renderer={renderStatusCodesChart}
        />
        <ReportWidget
          isLoading={isLoading}
          params={requestPaths.params}
          className="col-span-4 col-start-1"
          title="Slow API Requests"
          description="Most frequently used requests, sorted by total querying time"
          data={requestPaths.logData}
          renderer={renderRequestsPathsTable}
        />
      </div>
    </div>
  )
}
// const usePresetReport = (projectRef: string, preset: Presets) => {
// const params: LogsEndpointParams = { ...paramsToMerge, project: projectRef, sql }
// const endpointUrl = `${API_URL}/projects/${projectRef}/analytics/endpoints/logs.all?${genQueryParams(
//   params as any
// )}`
// const {
//   data,
//   error: swrError,
//   isValidating,
//   mutate,
// } = useSWR<any>(endpointUrl, get, {
//   revalidateOnFocus: false,
//   revalidateIfStale: false,
//   revalidateOnReconnect: false,
//   dedupingInterval: 5000,
// })

//   let error: null | string | object = swrError ? swrError.message : null
//   return [
//     {
//       logData: data?.result ? data.result[0] : undefined,
//       isLoading: isValidating,
//       error,
//     },
//     {
//       refresh: () => mutate(),
//     },
//   ]
// }

// const useWidgetQuery = (sql: string) => {}

export default PresetReport
