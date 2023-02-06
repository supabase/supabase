import Table from 'components/to-be-cleaned/Table'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import { ReportWidgetProps } from '../ReportWidget'
import Statistic from '../Statistic'

export const renderLargestObjectsPerBucket = (
  props: ReportWidgetProps<{
    name: string
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
          <Table.th className="sticky top-0 z-10">Name</Table.th>
          <Table.th className="sticky top-0 z-10">Mimetype</Table.th>
          <Table.th className="sticky top-0 z-10">Size</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.name}</Table.td>
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

export const renderTopDownloaded = (
  props: ReportWidgetProps<{
    count: number
    path: string
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">Path</Table.th>
          <Table.th className="sticky top-0 z-10">Download Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.path}</Table.td>
              <Table.td>{row.count}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}

export const renderMostFiles = (
  props: ReportWidgetProps<{
    owner: string
    file_count: number
    total_size: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">User</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
          <Table.th className="sticky top-0 z-10">Total Size</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.owner}</Table.td>
              <Table.td>{row.file_count}</Table.td>
              <Table.td>{row.total_size}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}
export const renderStaleFiles = (
  props: ReportWidgetProps<{
    one_month: number
    three_month: number
    six_month: number
    twelve_month: number
  }>
) => {
  if (!props.data[0]) return null
  return (
    <div className="flex flex-row w-full px-4 justify-between gap-4">
      {[
        { key: 'one_month', label: '1 Month' },
        { key: 'three_month', label: '3 Month' },
        { key: 'six_month', label: '6 Month' },
        { key: 'twelve_month', label: '12 Month' },
      ].map(({ key, label }) => (
        <div className="flex flex-col items-center">
          <Statistic value={props.data[0][key as keyof typeof props.data[0]]} />
          <span className="text-lg text-scale-1000">{label}</span>
        </div>
      ))}
    </div>
  )
}

export const renderTopSizes = (
  props: ReportWidgetProps<{
    count: number
    search: string
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">Search</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.count}</Table.td>
              <Table.td>{row.search}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}
export const renderCacheHitRate = (
  props: ReportWidgetProps<{
    timestamp: string
    hit_count: number
    miss_count: number
  }>
) => {
  const stackedData = props.data.flatMap((datum) => [
    {
      timestamp: datum.timestamp,
      count: datum.hit_count,
      type: 'hit',
    },
    {
      timestamp: datum.timestamp,
      count: datum.miss_count,
      type: 'miss',
    },
  ])

  return (
    <StackedBarChart
      hideHeader
      variant="percentages"
      data={stackedData}
      xAxisKey="timestamp"
      yAxisKey="count"
      stackKey="type"
    />
  )
}
