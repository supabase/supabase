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
import { DATETIME_FORMAT, PRESET_CONFIG, REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import { Presets } from './Reports.types'

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
    sql: config.sql.statusCodes(),
    ...DEFAULT_PARAMS,
  })

  const [requestPaths, requestPathsHandlers] = useLogsQuery(projectRef, {
    sql: config.sql.requestPaths(12),
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
  const requestPathsSums = requestPaths.logData.map((v) => v.sum) as number[]
  const requestPathsSumMax = Math.max(...requestPathsSums)
  const requestPathsSumMin = Math.min(...requestPathsSums)

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

      <div className="grid md:gap-4 lg:grid-cols-4 lg:gap-8">
        <Panel key="api-status-codes" className="col-span-4 col-start-1" wrapWithLoading={false}>
          <Panel.Content className="space-y-4">
            <h3>API Status Codes</h3>
            <StackedAreaChart
              dateFormat={DATETIME_FORMAT}
              data={statusCodes.logData}
              stackKey="status_code"
              xAxisKey="timestamp"
              yAxisKey="count"
              isLoading={statusCodes.isLoading}
              xAxisFormatAsDate
              size="large"
              styleMap={{
                200: { stroke: USAGE_COLORS['200'], fill: USAGE_COLORS['200'] },
                201: { stroke: USAGE_COLORS['201'], fill: USAGE_COLORS['201'] },
                400: { stroke: USAGE_COLORS['400'], fill: USAGE_COLORS['400'] },
                401: { stroke: USAGE_COLORS['401'], fill: USAGE_COLORS['401'] },
                404: { stroke: USAGE_COLORS['404'], fill: USAGE_COLORS['404'] },
                500: { stroke: USAGE_COLORS['500'], fill: USAGE_COLORS['500'] },
              }}
            />
          </Panel.Content>
        </Panel>
        <Panel
          key="top-routes"
          className="col-span-4 col-start-1 pb-0"
          bodyClassName="h-full"
          wrapWithLoading={false}
        >
          <Panel.Content className="space-y-4">
            <h3>Slow API Requests</h3>
            <Table
              className="border border-scale-600 rounded"
              head={
                <>
                  <Table.th>Path</Table.th>
                  <Table.th>Count</Table.th>
                  <Table.th>Avg. Time (ms)</Table.th>
                  <Table.th>Total Query Time</Table.th>
                </>
              }
              body={
                <>
                  {requestPaths.logData.map((row: any, index) => {
                    const totalQueryTimePercentage =
                      ((row.sum - requestPathsSumMin) / requestPathsSumMax) * 100
                    return (
                      <Table.tr key={index}>
                        <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                          <Collapsible className="w-full flex flex-col gap-2">
                            <Collapsible.Trigger asChild>
                              <button
                                className="w-full text-scale-1200 flex justify-start space-x-1"
                                type="button"
                              >
                                <IconChevronRight
                                  size="tiny"
                                  className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
                                />
                                <div className="flex space-x-2 items-center overflow-x-none">
                                  <p className="text-scale-1200 font-mono text-xs">{row.method}</p>
                                  <p className="font-mono text-scale-1200 text-xs truncate max-w-xs ">
                                    {row.path}
                                    <span className="text-scale-1000">{row.query_params}</span>
                                  </p>
                                </div>
                              </button>
                            </Collapsible.Trigger>
                            <Collapsible.Content className="bg-scale-300 p-2 rounded">
                              <pre className="text-xs syntax-highlight overflow-x-auto">
                                <div
                                  className="text-wrap"
                                  dangerouslySetInnerHTML={{
                                    __html: jsonSyntaxHighlight(
                                      queryParamsToObject(row.query_params)
                                    ),
                                  }}
                                />
                              </pre>
                            </Collapsible.Content>
                          </Collapsible>
                        </Table.td>
                        <Table.td style={{ padding: '0.5rem' }} className="text-xs align-top">
                          {row.count}
                        </Table.td>
                        <Table.td style={{ padding: '0.5rem' }} className="text-xs align-top">
                          {Number(row.avg_origin_time).toFixed(2)}
                        </Table.td>
                        <Table.td className="align-top py-1">
                          <div
                            className={`mt-1 h-2 rounded w-full bg-green-1100`}
                            style={{
                              width: `${totalQueryTimePercentage}%`,
                            }}
                          />
                        </Table.td>
                      </Table.tr>
                    )
                  })}
                </>
              }
            />
          </Panel.Content>
        </Panel>
      </div>
    </div>
  )
}

const queryParamsToObject = (params: string) => {
  return Object.fromEntries(new URLSearchParams(params))
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
