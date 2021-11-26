import { FC } from 'react'
import { Typography } from '@supabase/ui'
import DataGrid, { Row } from '@supabase/react-data-grid'

interface Props {
  results: any
}

const ResultsPane: FC<Props> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="p-5 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700">
        <Typography.Text>Success. No rows returned.</Typography.Text>
      </div>
    )
  }

  const columns = Object.keys(results[0]).map((key) => ({
    key,
    name: key,
    width: 120,
    resizable: true,
    headerRenderer: () => columnRender(key),
    formatter: ({ row }: { row: any }) => formatter(key, row),
  }))

  const formatter = (column: any, row: any) => {
    return <span className="font-mono text-xs">{row[column] + ''}</span>
  }
  const columnRender = (name: string) => {
    return (
      <div className="flex items-center justify-center font-mono h-full">
        <Typography.Text small>{name}</Typography.Text>
      </div>
    )
  }

  const rowRenderer = (props: any) => {
    const { row, viewportColumns: columns } = props
    columns.forEach((col: any) => {
      if (row[col.key] != null && typeof row[col.key] === 'object') {
        row[col.key] = JSON.stringify(row[col.key])
      }
    })
    return <Row {...props} />
  }

  return (
    <div className="flex-grow">
      <DataGrid
        columns={columns}
        rows={results}
        rowRenderer={rowRenderer}
        style={{ height: '100%' }}
      />
    </div>
  )
}

export default ResultsPane
