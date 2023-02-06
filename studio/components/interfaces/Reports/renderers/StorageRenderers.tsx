import Table from 'components/to-be-cleaned/Table'
import { ReportWidgetProps } from '../ReportWidget'

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
    one_year: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">1 Month</Table.th>
          <Table.th className="sticky top-0 z-10">3 Months</Table.th>
          <Table.th className="sticky top-0 z-10">6 Months</Table.th>
          <Table.th className="sticky top-0 z-10">12 Months</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.one_month}</Table.td>
              <Table.td>{row.three_month}</Table.td>
              <Table.td>{row.six_month}</Table.td>
              <Table.td>{row.one_year}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
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
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">timestamp</Table.th>
          <Table.th className="sticky top-0 z-10">hit</Table.th>
          <Table.th className="sticky top-0 z-10">miss</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => (
            <Table.tr key={index}>
              <Table.td>{row.timestamp}</Table.td>
              <Table.td>{row.hit_count}</Table.td>
              <Table.td>{row.miss_count}</Table.td>
            </Table.tr>
          ))}
        </>
      }
    />
  )
}
