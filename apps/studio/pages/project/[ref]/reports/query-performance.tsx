import { AccordionContent } from '@ui/components/shadcn/ui/accordion'
import { useParams } from 'common'
import SortPopover from 'components/grid/components/header/sort'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportQueryPerformanceTableRow from 'components/interfaces/Reports/ReportQueryPerformanceTableRow'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { useSearchReportsQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { executeSql } from 'data/sql/execute-sql-query'
import { useFlag } from 'hooks'
import { ChevronDown } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { NextPageWithLayout } from 'types'
import {
  Accordion,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Accordion_Shadcn_,
  Button,
  Button_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconAlertCircle,
  IconCheckCircle,
  IconList,
  IconRefreshCw,
  IconSearch,
  Input,
  Tabs,
} from 'ui'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)
  const tableIndexEfficiencyEnabled = useFlag('tableIndexEfficiency')
  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')
  const mostFrequentlyInvoked = hooks.mostFrequentlyInvoked()
  const mostTimeConsuming = hooks.mostTimeConsuming()
  const slowestExecutionTime = hooks.slowestExecutionTime()
  const queryHitRate = hooks.queryHitRate()
  const searchByQuery = useSearchReportsQuery({
    searchQuery: (router.query.search as string) || '',
    projectRef: project?.ref!,
  })
  const defaultSearchQueryValue = router.query.search ? String(router.query.search) : ''

  const isLoading = [
    mostFrequentlyInvoked.isLoading,
    mostTimeConsuming.isLoading,
    slowestExecutionTime.isLoading,
    queryHitRate.isLoading,
  ].every((value) => value)

  const handleRefresh = async () => {
    mostFrequentlyInvoked.runQuery()
    mostTimeConsuming.runQuery()
    slowestExecutionTime.runQuery()
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

  function onSortChange(sort: 'lat_desc' | 'lat_asc') {
    router.push({
      ...router,
      query: {
        ...router.query,
        sort,
      },
    })
  }

  function getSortButtonLabel() {
    const sort = router.query.sort as 'lat_desc' | 'lat_asc'

    if (sort === 'lat_desc') {
      return 'Sorted by latency - high to low'
    } else {
      return 'Sorted by latency - low to high'
    }
  }

  return (
    <ReportPadding>
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
                          {(queryHitRate?.data![0]?.ratio * 100).toFixed(2)}
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
                          {(queryHitRate?.data![1]?.ratio * 100).toFixed(2)}
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
        <Tabs type="underlined" size="medium">
          <Tabs.Panel key={1} id="1" label="Most time consuming">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {TimeConsumingHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto">
                <div className="flex justify-between items-center">
                  <form
                    className="py-3 flex gap-4"
                    id="log-panel-search"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.target as HTMLFormElement)
                      const searchQuery = formData.get('search')

                      if (!searchQuery || typeof searchQuery !== 'string') return

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
                      className="w-60"
                      size="tiny"
                      placeholder="Search roles or queries"
                      name="search"
                      defaultValue={defaultSearchQueryValue}
                      autoComplete="off"
                      icon={
                        <div className="text-foreground-lighter">
                          <IconSearch size={14} />
                        </div>
                      }
                      actions={
                        true && (
                          <button
                            onClick={() => {}}
                            className="mx-2 text-foreground-light hover:text-foreground"
                          >
                            {'↲'}
                          </button>
                        )
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button icon={<IconList />}>{getSortButtonLabel()}</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuItem>
                          <label>
                            <input
                              className=""
                              type="radio"
                              value="lat_desc"
                              defaultChecked={router.query.sort === 'lat_desc'}
                              onChange={(e) => {
                                if (e.target.value === 'lat_desc') {
                                  onSortChange(e.target.value)
                                }
                              }}
                            />
                            Sort by latency - high to low
                          </label>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <label>
                            <input
                              type="radio"
                              value="lat_asc"
                              className=""
                              defaultChecked={router.query.sort === 'lat_asc'}
                              onChange={(e) => {
                                if (e.target.value === 'lat_asc') {
                                  onSortChange(e.target.value)
                                }
                              }}
                            />
                            Sort by latency - low to high
                          </label>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </form>
                  <div>
                    <Button
                      type="default"
                      size="tiny"
                      onClick={handleRefresh}
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
                <Table
                  headTrClasses="expandable-tr"
                  head={
                    <>
                      <Table.th>Role</Table.th>
                      <Table.th>Time Consumed</Table.th>
                      <Table.th>Calls</Table.th>
                      <Table.th>Total Time</Table.th>
                      <Table.th>Query</Table.th>
                    </>
                  }
                  body={
                    !isLoading && mostTimeConsuming && mostTimeConsuming?.data ? (
                      mostTimeConsuming?.data?.map((item, i) => {
                        return (
                          <ReportQueryPerformanceTableRow
                            key={i + '-rqptr'}
                            item={item}
                          ></ReportQueryPerformanceTableRow>
                        )
                      })
                    ) : (
                      <></>
                    )
                  }
                />
              </div>
            </div>
          </Tabs.Panel>
          <Tabs.Panel key={2} id="2" label="Most frequent">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {MostFrequentHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto">
                <Table
                  head={
                    <>
                      {/* <Table.th className="table-cell">source</Table.th> */}
                      <Table.th className="table-cell">Role</Table.th>
                      <Table.th className="table-cell">Avg. Roles</Table.th>
                      <Table.th className="table-cell">Calls</Table.th>
                      <Table.th className="table-cell">Max Time</Table.th>
                      <Table.th className="table-cell">Mean Time</Table.th>
                      <Table.th className="table-cell">Min Time</Table.th>
                      <Table.th className="table-cell">Total Time</Table.th>
                      <Table.th className="table-cell">Query</Table.th>
                    </>
                  }
                  body={
                    !isLoading && mostFrequentlyInvoked && mostFrequentlyInvoked?.data ? (
                      mostFrequentlyInvoked.data?.map((item, i) => {
                        return (
                          <Table.tr key={i} hoverable className="relative">
                            <Table.td className="table-cell whitespace-nowrap w-28">
                              {item.rolname}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.avg_rows}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.calls}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.max_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.mean_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.min_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.total_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="relative table-cell whitespace-nowrap  w-24">
                              <p className="w-48 block truncate font-mono ">{item.query}</p>
                              <QueryActions
                                sql={item.query}
                                className="absolute inset-y-0 right-0"
                              />
                            </Table.td>
                          </Table.tr>
                        )
                      })
                    ) : (
                      <></>
                    )
                  }
                />
              </div>
            </div>
          </Tabs.Panel>
          <Tabs.Panel key={3} id="3" label="Slowest execution time">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames}>
                {SlowestExecutionHelperText}
              </ReactMarkdown>
              <div className="thin-scrollbars max-w-full overflow-auto">
                <Table
                  head={
                    <>
                      <Table.th className="table-cell">Role</Table.th>
                      <Table.th className="table-cell">Avg Rows</Table.th>
                      <Table.th className="table-cell">Calls</Table.th>
                      <Table.th className="table-cell">Max Time</Table.th>
                      <Table.th className="table-cell">Mean Time</Table.th>
                      <Table.th className="table-cell">Min Time</Table.th>
                      <Table.th className="table-cell">Total Time</Table.th>
                      <Table.th className="table-cell">Query</Table.th>
                    </>
                  }
                  body={
                    !isLoading && slowestExecutionTime && slowestExecutionTime?.data ? (
                      slowestExecutionTime.data?.map((item, i) => {
                        return (
                          <Table.tr key={i} hoverable className="relative">
                            <Table.td className="table-cell whitespace-nowrap w-24">
                              {item.rolname}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.avg_rows}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.calls}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.max_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.mean_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.min_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap truncate">
                              {item.total_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="relative table-cell whitespace-nowrap">
                              <p className="w-48 block truncate font-mono">{item.query}</p>
                              <QueryActions
                                sql={item.query}
                                className="absolute inset-y-0 right-0"
                              />
                            </Table.td>
                          </Table.tr>
                        )
                      })
                    ) : (
                      <></>
                    )
                  }
                />
              </div>
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>
    </ReportPadding>
  )
}

const QueryActions = ({ sql, className }: { sql: string; className: string }) => {
  if (sql.includes('insufficient privilege')) return null

  return (
    <div className={[className, 'flex justify-end items-center'].join(' ')}>
      <CopyButton type="default" text={sql} />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <ReportsLayout title="Query performance">{page}</ReportsLayout>
)

export default observer(QueryPerformanceReport)
