import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts/'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { Typography, Button, Dropdown, IconChevronDown, Badge, Popover } from '@supabase/ui'

import Panel from 'components/to-be-cleaned/Panel'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import Table from 'components/to-be-cleaned/Table'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { CHART_INTERVALS, USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import {
  EndpointResponse,
  PathsDatum,
  StatusCodesDatum,
} from 'components/interfaces/Home/ChartData.types'

export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref } = router.query

  const [interval, setInterval] = useState<string>('hourly')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const { data: codesData, error: codesFetchError } = useSWR<EndpointResponse<StatusCodesDatum>>(
    `${API_URL}/projects/${ref}/analytics/endpoints/usage.api-codes?interval=${interval}`,
    get
  )

  const { data: pathsData, error: _pathsFetchError }: any = useSWR<EndpointResponse<PathsDatum>>(
    `${API_URL}/projects/${ref}/analytics/endpoints/usage.api-paths?interval=${interval}`,
    get
  )
  return (
    <DatabaseLayout>
      <div className=" container mx-auto p-4 flex flex-row items-center gap-4">
        <h1 className="text-2xl ">API Requests</h1>
        <Dropdown
          side="bottom"
          align="start"
          overlay={
            <Dropdown.RadioGroup value={interval} onChange={setInterval}>
              {CHART_INTERVALS.map((i) => (
                <Dropdown.Radio key={i.key} value={i.key}>
                  {i.label}
                </Dropdown.Radio>
              ))}
            </Dropdown.RadioGroup>
          }
        >
          <Button as="span" type="default" iconRight={<IconChevronDown />}>
            Past {selectedInterval.label}
          </Button>
        </Dropdown>
      </div>

      <div className="flex flex-col gap-4 lg:gap-8 w-full">
        <Panel key="api-status-codes" className="col-start-1 col-span-2" wrapWithLoading={false}>
          <Panel.Content className="space-y-4">
            <PanelHeader title="API Status Codes" />
            <StackedAreaChart
              dateFormat={datetimeFormat}
              data={codesData?.result}
              stackKey="status_code"
              xAxisKey="timestamp"
              yAxisKey="count"
              isLoading={!codesData && !codesFetchError ? true : false}
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
          className="col-start-3 col-span-2 pb-0"
          bodyClassName="h-full"
          wrapWithLoading={false}
        >
          <Panel.Content className="space-y-4">
            <PanelHeader title="Top Routes" />
            <Table
              head={[
                <Table.th rowSpan={2}>Path</Table.th>,
                <Table.th rowSpan={2}>Count</Table.th>,
                <Table.th colSpan={3} className="text-center p-1">
                  Latency (ms)
                </Table.th>,
              ]}
              headSecondRow={[
                <Table.th className="p-1">Avg</Table.th>,
                <Table.th className="p-1">p95</Table.th>,
                <Table.th className="p-1">p99</Table.th>,
              ]}
              body={
                <>
                  {(pathsData?.result ?? []).map((row: PathsDatum) => (
                    <Table.tr>
                      <Table.td className="flex items-center space-x-2 text-xl">
                        <>
                          <p className="font-mono text-xs text-scale-1200">{row.method}</p>
                          <p className="font-mono text-xs">{row.path}</p>{' '}
                          {row.query_params && (
                            <Popover
                              align="end"
                              header={
                                <div className="flex justify-between items-center">
                                  <h5>Query Params</h5>
                                </div>
                              }
                              onOpenChange={function noRefCheck() {}}
                              overlay={[
                                <>
                                  <div className="py-6 px-2 space-y-4 max-w-sm">
                                    <p className="font-mono text-sm whitespace-pre-line">
                                      {row.query_params}
                                    </p>
                                  </div>
                                </>,
                              ]}
                              portalled
                              showClose
                              side="bottom"
                              size="content"
                            >
                              <Badge color="scale">?...</Badge>
                            </Popover>
                          )}
                        </>
                      </Table.td>
                      <Table.td>
                        <span className="text-xs">{row.count}</span>
                      </Table.td>
                      <Table.td>
                        <span className="text-xs">{Number(row.avg_origin_time).toFixed(0)}</span>
                      </Table.td>
                      <Table.td>
                        <span className="text-xs">{Number(row.p95).toFixed(0)}</span>
                      </Table.td>
                      <Table.td>
                        <span className="text-xs">{Number(row.p99).toFixed(0)}</span>
                      </Table.td>
                    </Table.tr>
                  ))}
                </>
              }
            />
          </Panel.Content>
        </Panel>
      </div>
    </DatabaseLayout>
  )
}

const PanelHeader = (props: any) => {
  const Tag = props?.href ? Link : 'div'
  return (
    <Tag href={props.href}>
      <div
        className={
          'flex items-center space-x-3 opacity-80 transition ' +
          (props.href ? 'cursor-pointer hover:opacity-100 hover:text-gray-1200' : '')
        }
      >
        <Typography.Text>{props.icon}</Typography.Text>
        <span className="flex items-center space-x-1">
          <h4 className="mb-0 text-lg">{props.title}</h4>
        </span>
      </div>
    </Tag>
  )
}

export default withAuth(observer(LogPage))
