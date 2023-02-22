import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ReportsLayout } from 'components/layouts'
import { Button, Tabs, Accordion, IconInfo } from 'ui'
import useDbQuery from 'hooks/analytics/useDbQuery'
import Table from 'components/to-be-cleaned/Table'
import { IconAlertCircle, IconCheckCircle } from '@supabase/ui'
import { executeSql } from 'data/sql/execute-sql-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import CopyButton from 'components/ui/CopyButton'

const limit = 50

const QueryMostFrequentlyInvoked = `
-- Most frequently called queries
-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    -- -- Postgres 13, 14, 15
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.min_exec_time + statements.min_plan_time as min_time,
    statements.max_exec_time + statements.max_plan_time as max_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time,
    -- -- Postgres <= 12
    -- total_time,
    -- min_time,
    -- max_time,
    -- mean_time,
    statements.rows / statements.calls as avg_rows
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    statements.calls desc
  limit
    ${limit};`

const QueryMostTimeConsuming = `-- Most time consuming queries
-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_total_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    total_time desc
  limit ${limit};`

const QuerySlowestExecutionTime = `-- Slowest queries by max execution time
-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    -- -- Postgres 13, 14, 15
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.min_exec_time + statements.min_plan_time as min_time,
    statements.max_exec_time + statements.max_plan_time as max_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time,
    -- -- Postgres <= 12
    -- total_time,
    -- min_time,
    -- max_time,
    -- mean_time,
    statements.rows / statements.calls as avg_rows
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    max_time desc
  limit
    ${limit};
`

const QueryHitRate = `-- Cache and index hit rate
select
    'index hit rate' as name,
    (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) as ratio
  from pg_statio_user_indexes
  union all
  select
    'table hit rate' as name,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) as ratio
  from pg_statio_user_tables;
`

const DatabaseExtensions: NextPageWithLayout = () => {
  const QueryMostFrequentlyInvokedData = useDbQuery(QueryMostFrequentlyInvoked)
  const QueryMostTimeConsumingData = useDbQuery(QueryMostTimeConsuming)
  const QuerySlowestExecutionTimeData = useDbQuery(QuerySlowestExecutionTime)
  const QueryHitRateData = useDbQuery(QueryHitRate)
  const { project } = useProjectContext()

  const isLoadedQueryMostFrequentlyInvokedData =
    QueryMostFrequentlyInvokedData &&
    QueryMostFrequentlyInvokedData.length > 0 &&
    QueryMostFrequentlyInvokedData[0] &&
    QueryMostFrequentlyInvokedData[0].data
      ? true
      : false
  const isLoadedQueryMostTimeConsumingData =
    QueryMostTimeConsumingData &&
    QueryMostTimeConsumingData.length > 0 &&
    QueryMostTimeConsumingData[0] &&
    QueryMostTimeConsumingData[0].data
      ? true
      : false
  const isLoadedQuerySlowestExecutionTimeData =
    QuerySlowestExecutionTimeData &&
    QuerySlowestExecutionTimeData.length > 0 &&
    QuerySlowestExecutionTimeData[0] &&
    QuerySlowestExecutionTimeData[0].data
      ? true
      : false
  const isLoadedQueryHitRateData =
    QueryHitRateData &&
    QueryHitRateData.length > 0 &&
    QueryHitRateData[0] &&
    QueryHitRateData[0].data
      ? true
      : false

  if (isLoadedQueryMostFrequentlyInvokedData) {
    console.log('QueryMostFrequentlyInvokedData', QueryMostFrequentlyInvokedData)
  }
  if (isLoadedQueryMostTimeConsumingData) {
    console.log('QueryMostTimeConsumingData', QueryMostTimeConsumingData)
  }
  if (isLoadedQuerySlowestExecutionTimeData) {
    console.log('QuerySlowestExecutionTimeData', QuerySlowestExecutionTimeData)
  }
  if (isLoadedQueryHitRateData) {
    console.log('QueryHitRateData', QueryHitRateData)
  }

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

  const indexHitRate = QueryHitRateData[0]?.data?.[0]?.ratio
  const tableHitRate = QueryHitRateData[0]?.data?.[1]?.ratio
  const showIndexWarning =
    indexHitRate && tableHitRate && (indexHitRate <= 0.99 || tableHitRate <= 0.99)

  const resetPgStatStatements = () => {
    executeSql({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      sql: `SELECT pg_stat_statements_reset();`,
    })
  }
  return (
    <div className="my-8 px-16 flex flex-col gap-8 justify-start">
      <h1 className="text-3xl">Insights</h1>

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
          {isLoadedQueryHitRateData && (
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
                        {(QueryHitRateData[0]?.data[0]?.ratio * 100).toFixed(2)}
                      </span>
                      <span className="text-xl">%</span>
                    </div>
                  </div>
                </div>

                <div className="w-1/2 bg-slate-200 rounded-md p-4">
                  {QueryHitRateData[0]?.data[1]?.name == 'table hit rate' && 'Table Hit Rate'}
                  <div className="flex items-center gap-2">
                    {tableHitRate >= 0.99
                      ? checkAlert
                      : tableHitRate >= 0.95
                      ? warnAlert
                      : dangerAlert}
                    <div className="flex items-baseline">
                      <span className="text-3xl">
                        {(QueryHitRateData[0]?.data[1]?.ratio * 100).toFixed(2)}
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

      <div className="flex flex-col">
        <h4 className="mb-4 text-2xl">Query Analysis</h4>
        <Tabs
          scrollable
          type="underlined"
          size="medium"
          addOnAfter={
            <div className="w-full flex justify-end mr-4">
              <Button type="default" onClick={resetPgStatStatements}>
                Reset analysis
              </Button>
            </div>
          }
        >
          <Tabs.Panel key={1} id="1" label="Most time consuming" className="text-sm max-w-none">
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
                  isLoadedQueryMostTimeConsumingData ? (
                    QueryMostTimeConsumingData[0].data.map((item, i) => {
                      return (
                        <Table.tr key={i} hoverable className="relative">
                          <Table.td className="table-cell whitespace-nowrap w-36">
                            {item.rolname}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.prop_total_time}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.total_time.toFixed(2)}ms
                          </Table.td>
                          <Table.td className="relative table-cell whitespace-nowrap w-36">
                            <p className="w-96 block truncate font-mono">{item.query}</p>
                            <QueryActions sql={item.query} className="absolute inset-y-0 right-0" />
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
          </Tabs.Panel>
          <Tabs.Panel key={2} id="2" label="Most frequent" className="text-sm max-w-none">
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
                  isLoadedQueryMostFrequentlyInvokedData ? (
                    QueryMostFrequentlyInvokedData[0].data.map((item, i) => {
                      return (
                        <Table.tr key={i} hoverable className="relative">
                          <Table.td className="table-cell whitespace-nowrap w-28">
                            {item.rolname}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.avg_rows}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
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
                            <QueryActions sql={item.query} className="absolute inset-y-0 right-0" />
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
          </Tabs.Panel>
          <Tabs.Panel key={3} id="3" label="Slowest execution time" className="text-sm max-w-none">
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
                  isLoadedQuerySlowestExecutionTimeData ? (
                    QuerySlowestExecutionTimeData[0].data.map((item, i) => {
                      return (
                        <Table.tr key={i} hoverable className="relative">
                          <Table.td className="table-cell whitespace-nowrap w-24">
                            {item.rolname}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.avg_rows}
                          </Table.td>
                          <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
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
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
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

DatabaseExtensions.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default observer(DatabaseExtensions)
