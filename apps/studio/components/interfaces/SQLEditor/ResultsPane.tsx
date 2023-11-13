import DataGrid, { Row } from 'react-data-grid'

interface ResultsPaneProps {
  results: any
}

const ResultsPane = ({ results }: ResultsPaneProps) => {
  if (results.length === 0) {
    return (
      <div className="p-5 flex items-center space-x-2 bg-gray-100 dark:bg-gray-700">
        <p>Success. No rows returned.</p>
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
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-mono">{name}</p>
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
        renderers={{ renderRow: rowRenderer }}
        style={{ height: '100%' }}
      />
    </div>
  )
}

export default ResultsPane
