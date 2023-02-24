import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { hooksFactory, usePresetReport } from 'components/interfaces/Reports/Reports.utils'
import { ReportsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { executeSql } from 'data/sql/execute-sql-query'
import { useFlag } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { NextPageWithLayout } from 'types'
import { Accordion, Button, IconAlertCircle, IconCheckCircle, Tabs } from 'ui'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const router = useRouter()
  const { ref } = router.query

  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)
  const tableIndexEfficiencyEnabled = useFlag('tableIndexEfficiency')

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = hooksFactory(ref as string, config)
  const mostFrequentlyInvoked = hooks.mostFrequentlyInvoked()
  const mostTimeConsuming = hooks.mostTimeConsuming()
  const slowestExecutionTime = hooks.slowestExecutionTime()
  const queryHitRate = hooks.queryHitRate()

  const { isLoading, Layout } = usePresetReport([
    mostFrequentlyInvoked,
    mostTimeConsuming,
    slowestExecutionTime,
    queryHitRate,
  ])

  console.log('ziinc mostFrequentlyInvoked', mostFrequentlyInvoked)

  const checkAlert = (
    <div className="w-5 h-5 text-brand-1400 text-brand-900 flex items-center justify-center">
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

  const indexHitRate = queryHitRate[0]?.data?.[0]?.ratio
  const tableHitRate = queryHitRate[0]?.data?.[1]?.ratio
  const showIndexWarning =
    indexHitRate && tableHitRate && (indexHitRate <= 0.99 || tableHitRate <= 0.99)

  const text = `This report will help you identify and understand queries that take the most time and resources
  from your database.

  You can read more about [query performance](https://supabase.com/docs/guides/platform/performance#examining-query-performance)
  in our docs.

  You may also want to reset this analysis when you are optimizing your queries. This analysis is based on the extensions.pg_stat_statements table, so this table will be cleared when resetting.
  `

  const TimeConsumingHelperText = `This report will show you statistics about queries ordered by the cumulative total execution time. 
  It shows the total time the query has spent running as well as the proportion of total execution time the query has taken up.
  `

  const MostFrequentHelperText = `This report is ordered by the number of times each query has been executed.

This provides useful information about the queries you run most frequently. Queries that have high max_time or mean_time times and are being called often can be good candidates for optimization.
  `

  const SlowestExecutionHelperText = `This report will show you statistics about queries ordered by the maximum execution time. 

  It is similar to the 'Most freqeunt' report ordered by calls, but this one highlights outliers that may have high executions times. Queries which have high or mean execution times are good candidates for optimisation.
  `

  const panelClassNames = 'text-sm max-w-none flex flex-col gap-8 py-4'
  const helperTextClassNames = 'prose text-sm max-w-3xl text-scale-1000'

  return (
    <Layout title="Query Performance" showDatePickers={false}>
      {tableIndexEfficiencyEnabled && (
        <Accordion
          openBehaviour="multiple"
          chevronAlign="right"
          className=" border p-2 bg-scale-300 rounded"
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
                          {(queryHitRate[0]?.data![0]?.ratio * 100).toFixed(2)}
                        </span>
                        <span className="text-xl">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-1/2 bg-slate-200 rounded-md p-4">
                    {queryHitRate[0]?.data![1]?.name == 'table hit rate' && 'Table Hit Rate'}
                    <div className="flex items-center gap-2">
                      {tableHitRate >= 0.99
                        ? checkAlert
                        : tableHitRate >= 0.95
                        ? warnAlert
                        : dangerAlert}
                      <div className="flex items-baseline">
                        <span className="text-3xl">
                          {(queryHitRate[0]?.data![1]?.ratio * 100).toFixed(2)}
                        </span>
                        <span className="text-xl">%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-8 pt-4 m-0">
                  <p className="text-scale-1100 text-sm max-w-2xl">
                    For best performance, ensure that the cache hit rate ratios above 99%. <br />{' '}
                    Consider upgrading to an instance with more memory if the ratios dip below 95%.
                  </p>
                </div>
              </div>
            )}
          </Accordion.Item>
        </Accordion>
      )}

      <ReactMarkdown className="prose text-sm text-scale-1000" children={text} />

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
          'This will reset the `extensions.pg_stat_statements` table that is used to calculate query performance.'
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
          } catch (error) {
            console.error(error)
          }
        }}
      />

      <div className="flex flex-col">
        <Tabs type="underlined" size="medium">
          <Tabs.Panel key={1} id="1" label="Most time consuming">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames} children={TimeConsumingHelperText} />
              <div className="thin-scrollbars max-w-full overflow-scroll">
                <Table
                  head={
                    <>
                      <Table.th className="table-cell">Role</Table.th>
                      <Table.th className="table-cell">Time Consumed</Table.th>
                      <Table.th className="table-cell">Calls</Table.th>
                      <Table.th className="table-cell">Total Time</Table.th>
                      <Table.th className="table-cell">Query</Table.th>
                    </>
                  }
                  body={
                    !isLoading && mostTimeConsuming ? (
                      mostTimeConsuming[0].data!.map((item, i) => {
                        return (
                          <Table.tr key={i} hoverable className="relative">
                            <Table.td className="table-cell whitespace-nowrap w-36">
                              {item.rolname}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.prop_total_time}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.calls}
                            </Table.td>
                            <Table.td className="table-cell whitespace-nowrap">
                              {item.total_time.toFixed(2)}ms
                            </Table.td>
                            <Table.td className="relative table-cell whitespace-nowrap w-36">
                              <p className="w-96 block truncate font-mono">{item.query}</p>
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
          <Tabs.Panel key={2} id="2" label="Most frequent">
            <div className={panelClassNames}>
              <ReactMarkdown className={helperTextClassNames} children={MostFrequentHelperText} />
              <div className="thin-scrollbars max-w-full overflow-scroll">
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
                    !isLoading && mostFrequentlyInvoked ? (
                      mostFrequentlyInvoked[0].data!.map((item, i) => {
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
              <ReactMarkdown
                className={helperTextClassNames}
                children={SlowestExecutionHelperText}
              />
              <div className="thin-scrollbars max-w-full overflow-scroll">
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
                    !isLoading && slowestExecutionTime ? (
                      slowestExecutionTime[0].data!.map((item, i) => {
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
                                sql={'item.query'}
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
    </Layout>
  )
}

const QueryActions = ({ sql, className }: { sql: string; className: string }) => {
  if (sql.includes('insufficient privilege')) return null

  return (
    <div className={[className, 'flex justify-center items-center mr-4'].join(' ')}>
      <CopyButton type="default" text={sql} />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <ReportsLayout title="Query performance">{page}</ReportsLayout>
)

export default observer(QueryPerformanceReport)
