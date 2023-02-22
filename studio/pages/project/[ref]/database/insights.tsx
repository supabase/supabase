import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Extensions } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { Button, IconGlobe, IconMonitor, IconThumbsUp, Tabs } from 'ui'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useEffect, useState } from 'react'
import Table from 'components/to-be-cleaned/Table'

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

export const Content = () => {
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

  return (
    <div className="my-8">
      <div className="px-16 mx-auto">
        <h1 className="text-3xl my-8">Insights</h1>
      </div>

      <div className="px-16 mx-auto my-12">
        <h4 className="mb-4 text-2xl">Index hit rate</h4>
        <p className="text-scale-1100 text-sm py-2 mb-6 max-w-2xl">
          For normal operations of Postgres and performance, you'll want to have your Postgres cache
          hit ratio about 99%. If you see your cache hit ratio below that, you probably need to look
          at moving to an instance with larger memory.
        </p>
        <div className="flex flex-row gap-16">
          <div>
            {isLoadedQueryHitRateData && QueryHitRateData[0]?.data[0]?.name}
            <div className="flex items-center gap-6">
              <div className="flex items-baseline">
                <h1 className="text-5xl">
                  {isLoadedQueryHitRateData &&
                    (QueryHitRateData[0]?.data[0]?.ratio * 100).toFixed(2)}
                </h1>
                <span className="text-3xl">%</span>
              </div>
              <div className="w-8 h-8 bg-brand-400 rounded border border-brand-500 text-brand-900 flex items-center justify-center">
                <IconThumbsUp strokeWidth={2} size={16} />
              </div>
            </div>
          </div>
          <div>
            {isLoadedQueryHitRateData && QueryHitRateData[0]?.data[1]?.name}
            <div className="flex items-center gap-6">
              <div className="flex items-baseline">
                <h1 className="text-5xl">
                  {isLoadedQueryHitRateData &&
                    (QueryHitRateData[0]?.data[1]?.ratio * 100).toFixed(2)}
                </h1>
                <span className="text-3xl">%</span>
              </div>
              <div className="w-8 h-8 bg-brand-400 rounded border border-brand-500 text-brand-900 flex items-center justify-center">
                <IconThumbsUp strokeWidth={2} size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex flex-col">
        <div className="px-16">
          <h4 className="mb-4 text-2xl">Query analysis</h4>
          <p className="text-scale-1100 text-sm py-2 mb-6 max-w-2xl">
            PLACEHOLDER We have outlined some query scenarios to check and allow you to analyze
            wether queries are behaving how you expect
          </p>
        </div>
        <Tabs
          scrollable
          type="underlined"
          size="medium"
          listClassNames="px-16"
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
          <Tabs.Panel
            key={1}
            id="1"
            label="Most time consuming"
            className="px-16 text-sm max-w-none"
          >
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
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.rolname}
                          </Table.td>
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
          <Tabs.Panel
            key={2}
            id="2"
            label="Most frequently used"
            className="px-16 text-sm max-w-none"
          >
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
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.rolname}
                          </Table.td>
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
          <Tabs.Panel
            key={3}
            id="3"
            label="Slowest execution time"
            className="px-16 text-sm max-w-none"
          >
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
                          <Table.td className="table-cell whitespace-nowrap">
                            {item.rolname}
                          </Table.td>
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
    </div>
  )
}

const DatabaseExtensions: NextPageWithLayout = () => {
  return <Content />
}

DatabaseExtensions.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseExtensions)
