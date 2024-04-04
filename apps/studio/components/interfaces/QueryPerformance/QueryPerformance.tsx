import { useRouter } from 'next/router'

import Table from 'components/to-be-cleaned/Table'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { Tabs } from 'ui'
import { Markdown } from '../Markdown'
import ReportQueryPerformanceTableRow from '../Reports/ReportQueryPerformanceTableRow'
import { PresetHookResult } from '../Reports/Reports.utils'
import { QueryPerformanceFilterBar } from './QueryPerformanceFilterBar'
import { QueryPerformanceLoadingRow } from './QueryPerformanceLoadingRow'
import { ResetAnalysisNotice } from './ResetAnalysisNotice'

type QueryPerformancePreset = 'time' | 'frequent' | 'slowest'

const panelClassNames = 'text-sm max-w-none flex flex-col gap-4'

const TimeConsumingHelperText = `This table lists queries ordered by their cumulative total execution time.

It displays the total time a query has spent running and the proportion of total execution time the query has consumed.
`

const MostFrequentHelperText = `This table lists queries in order of their execution count, providing insights into the most frequently executed queries.

Pay attention to queries with high max_time or mean_time values that are called frequently, as they may benefit from optimization.
`

const SlowestExecutionHelperText = `This table lists queries ordered by their maximum execution time. It shows outliers with high execution times.

Look for queries with high or mean execution times as these are often good candidates for optimization.
`

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
}: QueryPerformanceProps) => {
  const router = useRouter()
  const isLoading = [queryPerformanceQuery.isLoading, queryHitRate.isLoading].every(
    (value) => value
  )

  const handleRefresh = async () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
  }

  return (
    <Tabs
      type="underlined"
      size="medium"
      onChange={(e: string) => {
        // To reset the search and sort query params when switching tabs
        const { sort, search, ...rest } = router.query
        router.push({
          ...router,
          query: {
            ...rest,
            preset: e,
          },
        })
      }}
    >
      <Tabs.Panel key="time" id="time" label="Most time consuming">
        <div className={panelClassNames}>
          <Markdown
            content={TimeConsumingHelperText}
            className="max-w-full [&>p]:mt-0 [&>p]:m-0 space-y-2"
          />
          <ResetAnalysisNotice handleRefresh={handleRefresh} />
          <div className="thin-scrollbars max-w-full overflow-auto">
            <QueryPerformanceFilterBar onRefreshClick={handleRefresh} isLoading={isLoading} />
            <Table
              className="table-fixed"
              head={
                <>
                  <Table.th className="text-ellipsis overflow-hidden">Role</Table.th>
                  <Table.th className="w-[300px]">Query</Table.th>
                  <Table.th className="text-right">Calls</Table.th>
                  <Table.th className="text-right">Time Consumed</Table.th>
                  <Table.th className="text-right">Total Latency</Table.th>
                </>
              }
              body={
                !queryPerformanceQuery.isLoading ? (
                  queryPerformanceQuery?.data?.map((item, i) => {
                    return (
                      <ReportQueryPerformanceTableRow
                        key={i + '-mosttimeconsumed'}
                        sql={item.query}
                        colSpan={5}
                      >
                        <Table.td className="truncate" title={item.rolname}>
                          {item.rolname}
                        </Table.td>
                        <Table.td className="max-w-xs">
                          <p className="font-mono line-clamp-2 text-xs">{item.query}</p>
                        </Table.td>
                        <Table.td className="truncate text-right">{item.calls}</Table.td>
                        <Table.td className="truncate text-right">{item.prop_total_time}</Table.td>
                        <Table.td className="truncate text-right">
                          {item.total_time.toFixed(2)}ms
                        </Table.td>
                      </ReportQueryPerformanceTableRow>
                    )
                  })
                ) : (
                  <QueryPerformanceLoadingRow colSpan={5} />
                )
              }
            />
          </div>
        </div>
      </Tabs.Panel>
      <Tabs.Panel key="frequent" id="frequent" label="Most frequent">
        <div className={panelClassNames}>
          <Markdown
            content={MostFrequentHelperText}
            className="max-w-full [&>p]:mt-0 [&>p]:m-0 space-y-2"
          />
          <ResetAnalysisNotice handleRefresh={handleRefresh} />
          <div className="thin-scrollbars max-w-full overflow-auto">
            <QueryPerformanceFilterBar onRefreshClick={handleRefresh} isLoading={isLoading} />
            <Table
              head={
                <>
                  <Table.th className="">Role</Table.th>
                  <Table.th className="w-[300px]">Query</Table.th>
                  <Table.th className="text-right">Avg. Roles</Table.th>
                  <Table.th className="text-right">Calls</Table.th>
                  <Table.th className="text-right">Max Time</Table.th>
                  <Table.th className="text-right">Mean Time</Table.th>
                  <Table.th className="text-right">Min Time</Table.th>
                  <Table.th className="text-right">Total Latency</Table.th>
                </>
              }
              body={
                queryPerformanceQuery.isLoading ? (
                  <QueryPerformanceLoadingRow colSpan={8} />
                ) : (
                  queryPerformanceQuery.data?.map((item, i) => {
                    return (
                      <ReportQueryPerformanceTableRow
                        key={i + '-mostfreq'}
                        sql={item.query}
                        colSpan={8}
                      >
                        <Table.td className="truncate" title={item.rolname}>
                          {item.rolname}
                        </Table.td>
                        <Table.td className="min-w-xs">
                          <p className="text-xs font-mono line-clamp-2">{item.query}</p>
                        </Table.td>
                        <Table.td className="truncate text-right">{item.avg_rows}</Table.td>
                        <Table.td className="truncate text-right">{item.calls}</Table.td>
                        <Table.td className="truncate text-right">
                          {item.max_time?.toFixed(2)}ms
                        </Table.td>
                        <Table.td className="text-right truncate">
                          {item.mean_time?.toFixed(2)}ms
                        </Table.td>
                        <Table.td className="text-right truncate">
                          {item.min_time?.toFixed(2)}ms
                        </Table.td>
                        <Table.td className="text-right truncate">
                          {item.total_time?.toFixed(2)}ms
                        </Table.td>
                      </ReportQueryPerformanceTableRow>
                    )
                  })
                )
              }
            />
          </div>
        </div>
      </Tabs.Panel>
      <Tabs.Panel key="slowest" id="slowest" label="Slowest execution time">
        <div className={panelClassNames}>
          <Markdown
            content={SlowestExecutionHelperText}
            className="max-w-full [&>p]:mt-0 [&>p]:m-0 space-y-2"
          />
          <ResetAnalysisNotice handleRefresh={handleRefresh} />
          <div className="thin-scrollbars max-w-full overflow-auto">
            <QueryPerformanceFilterBar onRefreshClick={handleRefresh} isLoading={isLoading} />
            <Table
              head={
                <>
                  <Table.th className="table-cell">Role</Table.th>
                  <Table.th className="table-cell">Query</Table.th>
                  <Table.th className="table-cell">Avg Rows</Table.th>
                  <Table.th className="table-cell">Calls</Table.th>
                  <Table.th className="table-cell">Max Time</Table.th>
                  <Table.th className="table-cell">Mean Time</Table.th>
                  <Table.th className="table-cell">Min Time</Table.th>
                  <Table.th className="table-cell">Total Latency</Table.th>
                </>
              }
              body={
                queryPerformanceQuery.isLoading ? (
                  <QueryPerformanceLoadingRow colSpan={8} />
                ) : (
                  queryPerformanceQuery.data?.map((item, i) => {
                    return (
                      <ReportQueryPerformanceTableRow
                        key={i + '-slowestexec'}
                        sql={item.query}
                        colSpan={8}
                      >
                        <Table.td className="truncate" title={item.rolname}>
                          {item.rolname}
                        </Table.td>
                        <Table.td className="max-w-xs">
                          <p className="font-mono line-clamp-2 text-xs">{item.query}</p>
                        </Table.td>
                        <Table.td className="truncate">{item.avg_rows}</Table.td>
                        <Table.td className="truncate">{item.calls}</Table.td>
                        <Table.td className="truncate">{item.max_time?.toFixed(2)}ms</Table.td>
                        <Table.td className="truncate">{item.mean_time?.toFixed(2)}ms</Table.td>
                        <Table.td className="truncate">{item.min_time?.toFixed(2)}ms</Table.td>
                        <Table.td className="truncate">{item.total_time?.toFixed(2)}ms</Table.td>
                      </ReportQueryPerformanceTableRow>
                    )
                  })
                )
              }
            />
          </div>
        </div>
      </Tabs.Panel>
    </Tabs>
  )
}
