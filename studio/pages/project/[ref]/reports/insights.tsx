import { observer } from 'mobx-react-lite'
import { NextPageWithLayout } from 'types'
import { ReportsLayout } from 'components/layouts'
import { Button, IconcheckAlert, Tabs, Accordion } from 'ui'
import useDbQuery from 'hooks/analytics/useDbQuery'
import Table from 'components/to-be-cleaned/Table'
import { IconAlertCircle, IconCheckCircle } from '@supabase/ui'

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

  const indexHitRate = QueryHitRateData[0]?.data[0]?.ratio
  const tableHitRate = QueryHitRateData[0]?.data[1]?.ratio
  const showIndexWarning =
    indexHitRate && tableHitRate && (indexHitRate <= 0.99 || tableHitRate <= 0.99)
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
            <div className="flex flex-row gap-2 items-center">
              <span className="text-xl">Index Efficiency</span>
              {showIndexWarning ? warnAlert : checkAlert}
            </div>
          }
          id="1"
          className="flex flex-row gap-8"
        >
          {isLoadedQueryHitRateData && (
            <div className="flex flex-row flex-wrap px-8 py-4">
              <div className="w-1/2">
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

              <div className="w-1/2">
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
              <div className="w-full pt-4 m-0">
                <p className="text-scale-1100 text-sm m-0 p-0">
                  To best performance, ensure that the cache hit rate ratios above 99%. Consider
                  upgrading to an instance wiht more memory if the ratios dip below 95%.
                </p>
              </div>
            </div>
          )}
        </Accordion.Item>
      </Accordion>

      <div className="flex flex-col">
        <h4 className="mb-4 text-2xl">Query analysis</h4>
        <p className="text-scale-1100 text-sm py-2 mb-6 max-w-2xl">
          PLACEHOLDER We have outlined some query scenarios to check and allow you to analyze wether
          queries are behaving how you expect
        </p>
      </div>
      <Tabs
        scrollable
        type="underlined"
        size="medium"
        addOnAfter={
          <div className="w-full flex justify-end">
            <Button
              type="default"
              onClick={() => {
                useDbQuery(`SELECT pg_stat_statements_reset();`)
              }}
            >
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
                  <Table.th className="table-cell">rol name</Table.th>
                  <Table.th className="table-cell">prop_total_time</Table.th>
                  <Table.th className="table-cell">calls</Table.th>
                  <Table.th className="table-cell">total_time</Table.th>
                  <Table.th className="table-cell w-[200px]">query</Table.th>
                </>
              }
              body={
                isLoadedQueryMostTimeConsumingData ? (
                  QueryMostTimeConsumingData[0].data.map((item, i) => {
                    return (
                      <Table.tr key={i} hoverable className="relative">
                        <Table.td className="table-cell whitespace-nowrap">{item.rolname}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.prop_total_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.total_time}
                        </Table.td>
                        <Table.td className="w-[200px] table-cell whitespace-nowrap truncate">
                          <p className="truncate">{item.query}</p>
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
        <Tabs.Panel key={2} id="2" label="Most frequently used" className="text-sm max-w-none">
          <div className="thin-scrollbars max-w-full overflow-scroll">
            <Table
              head={
                <>
                  {/* <Table.th className="table-cell">source</Table.th> */}
                  <Table.th className="table-cell">rolname</Table.th>
                  <Table.th className="table-cell">avg_rows</Table.th>
                  <Table.th className="table-cell">calls</Table.th>
                  <Table.th className="table-cell">max_time</Table.th>
                  <Table.th className="table-cell">mean_time</Table.th>
                  <Table.th className="table-cell">min_time</Table.th>
                  <Table.th className="table-cell">total_time</Table.th>
                  <Table.th className="table-cell">query</Table.th>
                </>
              }
              body={
                isLoadedQueryMostFrequentlyInvokedData ? (
                  QueryMostFrequentlyInvokedData[0].data.map((item, i) => {
                    return (
                      <Table.tr key={i} hoverable className="relative">
                        <Table.td className="table-cell whitespace-nowrap">{item.rolname}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.avg_rows}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.max_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.mean_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.min_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.total_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.query}
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
                  <Table.th className="table-cell">rolname</Table.th>
                  <Table.th className="table-cell">avg_rows</Table.th>
                  <Table.th className="table-cell">calls</Table.th>
                  <Table.th className="table-cell">max_time</Table.th>
                  <Table.th className="table-cell">mean_time</Table.th>
                  <Table.th className="table-cell">min_time</Table.th>
                  <Table.th className="table-cell">total_time</Table.th>
                  <Table.th className="table-cell">query</Table.th>
                </>
              }
              body={
                isLoadedQuerySlowestExecutionTimeData ? (
                  QuerySlowestExecutionTimeData[0].data.map((item, i) => {
                    return (
                      <Table.tr key={i} hoverable className="relative">
                        <Table.td className="table-cell whitespace-nowrap">{item.rolname}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.avg_rows}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.max_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.mean_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.min_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.total_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.query}
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
  )
}

DatabaseExtensions.getLayout = (page) => <ReportsLayout title="Database">{page}</ReportsLayout>

export default observer(DatabaseExtensions)
