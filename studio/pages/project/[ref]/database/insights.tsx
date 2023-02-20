import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { Extensions } from 'components/interfaces/Database'
import NoPermission from 'components/ui/NoPermission'
import { Button, IconGlobe, IconMonitor, Tabs } from 'ui'
import useDbQuery from 'hooks/analytics/useDbQuery'
import { useEffect, useState } from 'react'
import Table from 'components/to-be-cleaned/Table'

const limit = 100

const QueryMostFrequentlyInvoked = `
SELECT
auth.rolname,
interval '1 millisecond' * statements.total_exec_time AS total_exec_time,
to_char((statements.total_exec_time/sum(statements.total_exec_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(statements.calls, 'FM999G999G999G990') AS ncalls,
statements.query AS query
FROM pg_stat_statements as statements
INNER JOIN pg_authid AS auth ON statements.userid = auth.oid
ORDER BY total_exec_time DESC
LIMIT ${limit};
`

const QueryMostTimeConsuming = `
SELECT
auth.rolname,
interval '1 millisecond' * statements.total_exec_time AS total_exec_time,
to_char((statements.total_exec_time/sum(statements.total_exec_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(statements.calls, 'FM999G999G999G990') AS ncalls,
statements.query AS query
FROM pg_stat_statements as statements
INNER JOIN pg_authid AS auth ON statements.userid = auth.oid
ORDER BY total_exec_time DESC
LIMIT ${limit};
`

const QuerySlowestExecutionTime = `
select
    auth.rolname,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.min_exec_time + statements.min_plan_time as min_time,
    statements.max_exec_time + statements.max_plan_time as max_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time,
    statements.rows / statements.calls as avg_rows,
    statements.query
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    max_time desc
  limit
    ${limit};
`

export const Content = () => {
  // const [timeConsumingData, setTimeConsumingData] = useState<any[]>()

  // async function fetchData() {
  //   try {
  //     const data = await useDbQuery(QueryMostFrequentlyInvoked)
  //     setTimeConsumingData(data)
  //     return data
  //   } catch (error) {
  //     throw error
  //   }
  // }

  // useEffect(() => {
  //   fetchData()
  // }, [])

  const QueryMostFrequentlyInvokedData = useDbQuery(QueryMostFrequentlyInvoked)
  const QueryMostTimeConsumingData = useDbQuery(QueryMostTimeConsuming)
  const QuerySlowestExecutionTimeData = useDbQuery(QuerySlowestExecutionTime)

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

  // if (isLoadedQueryMostFrequentlyInvokedData) {
  //   console.log('QueryMostFrequentlyInvokedData', QueryMostFrequentlyInvokedData)
  // }
  if (isLoadedQueryMostTimeConsumingData) {
    console.log('QueryMostTimeConsumingData', QueryMostTimeConsumingData)
  }
  // if (isLoadedQuerySlowestExecutionTimeData) {
  //   console.log('QuerySlowestExecutionTimeData', QuerySlowestExecutionTimeData)
  // }

  return (
    <div className="my-8">
      <div className="px-16 mx-auto">
        <h1 className="text-3xl my-8">Insights</h1>
      </div>
      <div className="mx-auto flex flex-col">
        <Tabs
          scrollable
          type="underlined"
          size="large"
          listClassNames="px-16"
          addOnAfter={
            <Button
              type="default"
              onClick={() => {
                useDbQuery(`SELECT pg_stat_statements_reset();`)
              }}
            >
              Reset all insights
            </Button>
          }
        >
          <Tabs.Panel
            key={1}
            id="1"
            label="Most time consuming"
            className="px-16 text-sm max-w-none"
          >
            <p className="">
              This measures the aggregate time spend by a query on somethong spmetong.
            </p>
            <p>This measures the aggregate time spend by a query on somethong spmetong.</p>
            <Table
              head={
                <>
                  <Table.th className="table-cell">rol name</Table.th>
                  <Table.th className="table-cell">total_exec_time</Table.th>
                  <Table.th className="table-cell">prop_exec_time</Table.th>
                  <Table.th className="table-cell">ncalls</Table.th>
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
                          {item.total_exec_time.milliseconds} ms
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.prop_exec_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.ncalls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
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
          </Tabs.Panel>
          <Tabs.Panel
            key={2}
            id="2"
            label="Most frequently used"
            className="px-16 text-sm max-w-none"
          >
            <p className="">
              This measures the aggregate time spend by a query on somethong spmetong.
            </p>
            <p>This measures the aggregate time spend by a query on somethong spmetong.</p>
            <Table
              head={
                <>
                  <Table.th className="table-cell">source</Table.th>
                  <Table.th className="table-cell">rolname</Table.th>
                  <Table.th className="table-cell">ncalls</Table.th>
                  <Table.th className="table-cell">prop_exec_time</Table.th>
                  <Table.th className="table-cell">total_exec_time</Table.th>
                  <Table.th className="table-cell">query</Table.th>
                </>
              }
              body={
                isLoadedQueryMostTimeConsumingData ? (
                  QueryMostTimeConsumingData[0].data.map((item, i) => {
                    return (
                      <Table.tr key={i} hoverable className="relative">
                        <Table.td className="whitespace-nowrap flex gap-3 items-center text-scale-1200">
                          {item.query.includes('-- source: dashboard') ? (
                            <>
                              <IconMonitor size={12} /> Dashboard
                            </>
                          ) : (
                            <>
                              <IconGlobe size={12} /> API
                            </>
                          )}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.rolname}{' '}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.ncalls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.prop_exec_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.total_exec_time.seconds && item.total_exec_time.seconds + 's'}{' '}
                          {item.total_exec_time.milliseconds}ms
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
          </Tabs.Panel>
          <Tabs.Panel
            key={3}
            id="3"
            label="Slowest execution time"
            className="px-16 text-sm max-w-none"
          >
            <p className="">
              This measures the aggregate time spend by a query on somethong spmetong.
            </p>
            <p>This measures the aggregate time spend by a query on somethong spmetong.</p>
            <Table
              head={
                <>
                  <Table.th className="table-cell">rol name</Table.th>
                  <Table.th className="table-cell">calls</Table.th>
                  <Table.th className="table-cell">total_time</Table.th>
                  <Table.th className="table-cell">min_time</Table.th>
                  <Table.th className="table-cell">max_time</Table.th>
                  <Table.th className="table-cell">mean_time</Table.th>
                  <Table.th className="table-cell">avg_rows</Table.th>
                  <Table.th className="table-cell">query</Table.th>
                </>
              }
              body={
                isLoadedQuerySlowestExecutionTimeData ? (
                  QuerySlowestExecutionTimeData[0].data.map((item, i) => {
                    return (
                      <Table.tr key={i} hoverable className="relative">
                        <Table.td className="table-cell whitespace-nowrap">{item.rolname}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">{item.calls}</Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.total_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.min_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap truncate">
                          {item.max_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.mean_time}
                        </Table.td>
                        <Table.td className="table-cell whitespace-nowrap">
                          {item.avg_rows}
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
