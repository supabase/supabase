import { useRouter } from 'next/router'
import { useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import dayjs from 'dayjs'
import { cn } from 'ui'
import { TextSearch } from 'lucide-react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

interface QueryListProps {
  queries: QueryInsightsQuery[]
  isLoading: boolean
}

export const QueryList = ({ queries, isLoading }: QueryListProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const [selectedRow, setSelectedRow] = useState<number>()

  const columns: Column<QueryInsightsQuery>[] = [
    {
      key: 'timestamp',
      name: 'Time',
      resizable: true,
      minWidth: 120,
      headerCellClass: 'first:pl-6',
      renderCell: (props) => (
        <div className="font-mono text-xs">{dayjs(props.row.timestamp).format('HH:mm:ss')}</div>
      ),
    },
    {
      key: 'query',
      name: 'Query',
      resizable: true,
      minWidth: 400,
      headerCellClass: '',
      renderCell: (props) => <div className="font-mono text-xs truncate">{props.row.query}</div>,
    },
    {
      key: 'calls',
      name: 'Calls',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs text-right">{props.row.calls.toLocaleString()}</div>
      ),
    },
    {
      key: 'total_time',
      name: 'Total Time',
      resizable: true,
      minWidth: 120,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs text-right">
          <p>{props.row.total_time.toFixed(0)}ms</p>
          <p className="text-foreground-lighter">{(props.row.total_time / 1000).toFixed(2)}s</p>
        </div>
      ),
    },
    {
      key: 'mean_exec_time',
      name: 'Mean Time',
      resizable: true,
      minWidth: 120,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs text-right">
          <p>{props.row.mean_exec_time.toFixed(0)}ms</p>
          <p className="text-foreground-lighter">{(props.row.mean_exec_time / 1000).toFixed(2)}s</p>
        </div>
      ),
    },
    {
      key: 'rows',
      name: 'Rows',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs text-right">{props.row.rows.toLocaleString()}</div>
      ),
    },
    {
      key: 'database',
      name: 'Database',
      resizable: true,
      minWidth: 120,
      headerCellClass: '',
      renderCell: (props) => <div className="font-mono text-xs">{props.row.database}</div>,
    },
  ]

  return (
    <div className="border rounded-md bg-surface-100 flex-grow flex flex-col">
      <DataGrid
        ref={gridRef}
        style={{ height: '100%' }}
        className={cn('flex-1')}
        rowHeight={44}
        headerRowHeight={36}
        columns={columns}
        rows={queries}
        rowClass={(_, idx) => {
          const isSelected = idx === selectedRow
          return [
            `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
            `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-4',
          ].join(' ')
        }}
        renderers={{
          renderRow: (idx, props) => (
            <Row
              {...props}
              key={`qi-row-${props.rowIdx}`}
              onClick={() => {
                if (typeof idx === 'number' && idx >= 0) {
                  setSelectedRow(idx)
                  gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                }
              }}
            />
          ),
          noRowsFallback: isLoading ? (
            <div className="absolute top-14 px-6 w-full">
              <GenericSkeletonLoader />
            </div>
          ) : (
            <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
              <TextSearch className="text-foreground-muted" strokeWidth={1} />
              <div className="text-center">
                <p className="text-foreground">No queries detected</p>
                <p className="text-foreground-light">
                  There are no actively running queries that match the criteria
                </p>
              </div>
            </div>
          ),
        }}
      />
    </div>
  )
}
