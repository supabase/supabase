import { useParams } from 'common'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportQueryPerformanceTableRow from 'components/interfaces/Reports/ReportQueryPerformanceTableRow'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { executeSql } from 'data/sql/execute-sql-query'
import { useFlag } from 'hooks'
import { sortBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { NextPageWithLayout } from 'types'
import {
  Accordion,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  IconAlertCircle,
  IconArrowDown,
  IconArrowUp,
  IconCheckCircle,
  IconList,
  IconRefreshCw,
  IconSearch,
  Input,
  Tabs,
} from 'ui'

type QueryPerformancePreset = 'time' | 'frequent' | 'slowest'
const QueryPerformanceReport: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)
  const tableIndexEfficiencyEnabled = useFlag('tableIndexEfficiency')
  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')
  const queryHitRate = hooks.queryHitRate()

  const orderBy = (router.query.sort as 'lat_desc' | 'lat_asc') || 'lat_desc'
  const searchQuery = (router.query.search as string) || ''
  const presetMap = {
    time: 'mostTimeConsuming',
    frequent: 'mostFrequentlyInvoked',
    slowest: 'slowestExecutionTime',
  } as const
  const preset = presetMap[router.query.preset as QueryPerformancePreset] || 'mostTimeConsuming'

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
  })

  const isLoading = [queryPerformanceQuery.isLoading, queryHitRate.isLoading].every(
    (value) => value
  )

  const handleRefresh = async () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
  }

  const checkAlert = (
    <div className="w-5 h-5 text-brand-1400 text-brand flex items-center justify-center">
      <IconCheckCircle strokeWidth={2} size={16} />
    </div>
  )
  const warnAlert = (
    <div className="w-6 h-6 text-yellow-900 flex items-center justify-center">
      <IconAlertCircle strokeWidth={2} size={16} />
    </div>
  )
  const dangerAlert = (
    <div className="w-6 h-6 text-red-900 flex items-center justify-center">
      <IconAlertCircle strokeWidth={2} size={16} />
    </div>
  )

  const indexHitRate = queryHitRate.data?.[0]?.ratio
  const tableHitRate = queryHitRate.data?.[1]?.ratio
  const showIndexWarning =
    indexHitRate && tableHitRate && (indexHitRate <= 0.99 || tableHitRate <= 0.99)

  const headerText = (
    <p className="whitespace-pre-wrap prose text-sm max-w-2xl text-foreground-light">
      Identify the queries that consume the most time and database resources.
      {'\n\n'}It relies on the <code>pg_stat_statements</code> table. Read more about{' '}
      <Link
        href="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
        target="_blank"
        rel="noreferrer"
      >
        examining query performance
      </Link>
      .{'\n\n'}Consider resetting the analysis after optimizing any queries.
    </p>
  )

  const TimeConsumingHelperText = `This table lists queries ordered by their cumulative total execution time.

  It displays the total time a query has spent running and the proportion of total execution time the query has consumed.
`

  const MostFrequentHelperText = `This table lists queries in order of their execution count, providing insights into the most frequently executed queries.

  Pay attention to queries with high max_time or mean_time values that are called frequently, as they may benefit from optimization.
`

  const SlowestExecutionHelperText = `This table lists queries ordered by their maximum execution time. It shows outliers with high execution times. Queries with long execution times may benefit from optimization.

  Look for queries with high or mean execution times. These are often good candidates for optimization.
`
  const panelClassNames = 'text-sm max-w-none flex flex-col gap-8 py-4'
  const helperTextClassNames = 'prose text-sm max-w-2xl text-foreground-light'

  return (
    <div className="p-4 py-3">
      <ReportHeader title="Query Performance" isLoading={isLoading} onRefresh={handleRefresh} />
      {tableIndexEfficiencyEnabled && (
        <Accordion
          openBehaviour="multiple"
          chevronAlign="right"
          className="border p-2 bg-surface-100 rounded"
        >
          <Accordion.Item
            header={
              <div className="flex flex-row gap-2 items-center p-2">
                <span className="text-xl">Index Efficiency</span>
                {showIndexWarning ? warnAlert : checkAlert}
              </div>
            }
            id="1"
            className="flex flex-row gap-8"
          >
            {!isLoading && queryHitRate && (
              <div>
                <div className="flex flex-row px-8 py-4 gap-8">
                  <div className="w-1/2 bg-slate-200 rounded-md p-4">
                    Index Hit Rate
                    <div className="flex items-center gap-2">
                      {indexHitRate >= 0.99
                        ? checkAlert
                        : indexHitRate >= 0.95
                          ? warnAlert
                          : dangerAlert}
                      <div className="flex items-baseline">
                        <span className="text-3xl">
                          {queryHitRate?.data && (queryHitRate?.data[0]?.ratio * 100).toFixed(2)}
                        </span>
                        <span className="text-xl">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-1/2 bg-slate-200 rounded-md p-4">
                    {queryHitRate?.data![1]?.name == 'table hit rate' && 'Table Hit Rate'}
                    <div className="flex items-center gap-2">
                      {tableHitRate >= 0.99
                        ? checkAlert
                        : tableHitRate >= 0.95
                          ? warnAlert
                          : dangerAlert}
                      <div className="flex items-baseline">
                        <span className="text-3xl">
                          {queryHitRate?.data && (queryHitRate?.data[1]?.ratio * 100).toFixed(2)}
                        </span>
                        <span className="text-xl">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-8 pt-4 m-0">
                  <p className="text-foreground-light text-sm max-w-2xl">
                    For best performance, ensure that the cache hit rate ratios above 99%. <br />{' '}
                    Consider upgrading to an instance with more memory if the ratios dip below 95%.
                  </p>
                </div>
              </div>
            )}
          </Accordion.Item>
        </Accordion>
      )}

      {headerText}

      <div className="mb-8">
        <Button type="default" onClick={() => setShowResetgPgStatStatements(true)}>
          Reset analysis
        </Button>
      </div>

      <ConfirmModal
        danger
        visible={showResetgPgStatStatements}
        title="Reset query performance analysis"
        description={
          'This will reset the `extensions.pg_stat_statements` table that is used to calculate query performance. This data will repopulate immediately after.'
        }
        buttonLabel="Clear table"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setShowResetgPgStatStatements(false)}
        onSelectConfirm={async () => {
          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            setShowResetgPgStatStatements(false)
            handleRefresh()
          } catch (error) {
            console.error(error)
          }
        }}
      />

      <div className="flex flex-col">
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
          <Tabs.Panel key={'time'} id="time" label="Most time consuming">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {TimeConsumingHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto min-h-[800px]">
                <QueryPerformanceFilterBar onRefreshClick={handleRefresh} isLoading={isLoading} />
                <Table
                  className="table-fixed"
                  head={
                    <>
                      <Table.th className="text-ellipsis overflow-hidden">Role</Table.th>
                      <Table.th className="w-[300px]">Query</Table.th>
                      <Table.th className="text-right">Calls</Table.th>
                      <Table.th className="text-right">Time Consumed</Table.th>
                      <Table.th className="text-right">Total Time (Latency)</Table.th>
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
                            <Table.td className="truncate text-right">
                              {item.prop_total_time}
                            </Table.td>
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
          <Tabs.Panel key={'frequent'} id="frequent" label="Most frequent">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {MostFrequentHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto min-h-[800px]">
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
                      <Table.th className="text-right">Total Time (Latency)</Table.th>
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
          <Tabs.Panel key={'slowest'} id="slowest" label="Slowest execution time">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {SlowestExecutionHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto min-h-[800px]">
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
                      <Table.th className="table-cell">Total Time (Latency)</Table.th>
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
                            <Table.td className="truncate">
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
        </Tabs>
      </div>
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <ReportsLayout title="Query performance">{page}</ReportsLayout>
)

export default observer(QueryPerformanceReport)

function QueryPerformanceFilterBar({
  isLoading,
  onRefreshClick,
}: {
  isLoading: boolean
  onRefreshClick: () => void
}) {
  const router = useRouter()
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''
  const defaultSortByValue = router.query.sort ? String(router.query.sort) : 'lat_desc'
  const [searchInputVal, setSearchInputVal] = useState(defaultSearchQueryValue)
  const [sortByValue, setSortByValue] = useState(defaultSortByValue)

  function getSortButtonLabel() {
    const sort = router.query.sort as 'lat_desc' | 'lat_asc'

    if (sort === 'lat_desc') {
      return 'Sorted by latency - high to low'
    } else {
      return 'Sorted by latency - low to high'
    }
  }

  function onSortChange(sort: string) {
    setSortByValue(sort)
    router.push({
      ...router,
      query: {
        ...router.query,
        sort,
      },
    })
  }

  const ButtonIcon = sortByValue === 'lat_desc' ? IconArrowDown : IconArrowUp

  return (
    <>
      <div className="flex justify-between items-center">
        <form
          className="py-3 flex gap-4"
          id="log-panel-search"
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            const searchQuery = formData.get('search')

            if (!searchQuery || typeof searchQuery !== 'string') {
              // if user has deleted the search query, remove it from the url
              const { search, ...rest } = router.query
              router.push({
                ...router,
                query: {
                  ...rest,
                },
              })
              return
            }

            router.push({
              ...router,
              query: {
                ...router.query,
                search: searchQuery,
              },
            })
          }}
        >
          <Input
            className="w-60 group"
            size="tiny"
            placeholder="Search roles or queries"
            name="search"
            value={searchInputVal}
            onChange={(e) => setSearchInputVal(e.target.value)}
            autoComplete="off"
            icon={
              <div className="text-foreground-lighter">
                <IconSearch size={14} />
              </div>
            }
            actions={
              searchInputVal !== '' && (
                <button className="mx-2 text-foreground-light hover:text-foreground">{'↲'}</button>
              )
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button icon={<ButtonIcon />}>{getSortButtonLabel()}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuRadioGroup value={sortByValue} onValueChange={onSortChange}>
                <DropdownMenuRadioItem
                  defaultChecked={router.query.sort === 'lat_desc'}
                  value={'lat_desc'}
                >
                  Sort by latency - high to low
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value={'lat_asc'}
                  defaultChecked={router.query.sort === 'lat_asc'}
                >
                  Sort by latency - low to high
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </form>
        <div>
          <Button
            type="default"
            size="tiny"
            onClick={onRefreshClick}
            disabled={isLoading ? true : false}
            icon={
              <IconRefreshCw
                size="tiny"
                className={`text-foreground-light ${isLoading ? 'animate-spin' : ''}`}
              />
            }
          >
            {isLoading ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>
    </>
  )
}

function QueryPerformanceLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array(4)
        .fill('')
        .map((_, i) => (
          <tr key={'loading-' + { i }}>
            <td colSpan={colSpan}>
              <ShimmeringLoader />
            </td>
          </tr>
        ))}
    </>
  )
}
