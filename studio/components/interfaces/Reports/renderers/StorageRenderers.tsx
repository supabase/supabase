import { Button, IconChevronRight } from 'ui'
import { jsonSyntaxHighlight } from 'components/interfaces/Settings/Logs/LogsFormatters'
import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import Table from 'components/to-be-cleaned/Table'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { useState } from 'react'
import { DATETIME_FORMAT } from '../Reports.constants'
import { PathsDatum, StatusCodesDatum } from '../Reports.types'
import { queryParamsToObject } from '../Reports.utils'
import { ReportWidgetProps } from '../ReportWidget'

export const renderLargestObjectsPerBucket = (
  props: ReportWidgetProps<{
    path_tokens: string
    mimetype: string
    bucket_id: string
    size: number
    row: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">Path</Table.th>
          <Table.th className="sticky top-0 z-10">Mimetype</Table.th>
          <Table.th className="sticky top-0 z-10">Size</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.path_tokens}</Table.td>
              <Table.td>{row.bucket_id}</Table.td>
              <Table.td>{row.size}</Table.td>
              <Table.td>{row.row}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}
