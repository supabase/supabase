import { useRouter } from 'next/router'
import { useRef, useState, useEffect } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import dayjs from 'dayjs'
import { cn, CodeBlock } from 'ui'
import { TextSearch } from 'lucide-react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

interface QueryListProps {
  queries: QueryInsightsQuery[]
  isLoading: boolean
  onQuerySelect?: (query: QueryInsightsQuery | null) => void
  onQueryHover?: (query: QueryInsightsQuery | null) => void
  selectedQuery?: QueryInsightsQuery | null
  hoveredQuery?: QueryInsightsQuery | null
}

export const QueryList = ({
  queries,
  isLoading,
  onQuerySelect,
  onQueryHover,
  selectedQuery,
  hoveredQuery,
}: QueryListProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const [selectedRow, setSelectedRow] = useState<number | undefined>()
  const [hoveredRow, setHoveredRow] = useState<number | undefined>()

  const normalizeWhitespace = (sql: string) => {
    return sql.replace(/\s+/g, ' ').trim()
  }

  // Update selected row when selectedQuery changes from parent
  useEffect(() => {
    if (selectedQuery) {
      const idx = queries.findIndex((q) => q.query_id === selectedQuery.query_id)
      if (idx !== -1) {
        setSelectedRow(idx)
      }
    } else {
      setSelectedRow(undefined)
    }
  }, [selectedQuery, queries])

  // Handler for row click
  const handleRowClick = (idx: number) => {
    if (isNaN(idx) || idx < 0 || idx >= queries.length) return

    const query = queries[idx]
    const isAlreadySelected = selectedQuery?.query_id === query.query_id

    // If the query is already selected, deselect it
    if (isAlreadySelected) {
      setSelectedRow(undefined)
      onQuerySelect?.(null)
    } else {
      // Otherwise, select the new query
      setSelectedRow(idx)
      onQuerySelect?.(query)
    }

    // Scroll to keep the row in view
    gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
  }

  // Handler for row hover
  const handleRowMouseEnter = (idx: number) => {
    if (isNaN(idx) || idx < 0 || idx >= queries.length) return
    if (selectedQuery) return // Don't trigger hover when a query is already selected

    const query = queries[idx]
    setHoveredRow(idx)
    onQueryHover?.(query)
    console.log('Query hover:', query.query_id, query.query.substring(0, 50) + '...')
  }

  const handleRowMouseLeave = () => {
    if (selectedQuery) return // Don't clear hover when a query is already selected

    setHoveredRow(undefined)
    onQueryHover?.(null)
    console.log('Query hover cleared')
  }

  const rowClassRender = (row: QueryInsightsQuery) => {
    const isSelected = selectedQuery?.query_id === row.query_id
    const isHovered = hoveredQuery?.query_id === row.query_id && !selectedQuery

    return cn(
      'cursor-pointer transition-colors',
      isSelected ? 'bg-surface-300' : isHovered ? 'bg-surface-200' : ''
    )
  }

  const columns: Column<QueryInsightsQuery>[] = [
    // {
    //   key: 'timestamp',
    //   name: 'Time',
    //   resizable: true,
    //   minWidth: 120,
    //   headerCellClass: 'first:pl-6',
    //   renderCell: (props) => (
    //     <div className="font-mono text-xs">{dayjs(props.row.timestamp).format('HH:mm:ss')}</div>
    //   ),
    // },
    {
      key: 'query',
      name: 'Query',
      resizable: true,
      minWidth: 400,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs truncate w-full overflow-hidden">
          <CodeBlock
            language="sql"
            className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap !overflow-visible"
            hideLineNumbers
            hideCopy
          >
            {normalizeWhitespace(props.row.query)}
          </CodeBlock>
        </div>
      ),
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
      key: 'rows_read',
      name: 'Rows Read',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div
          className={cn(
            'font-mono text-xs text-right',
            selectedQuery && selectedQuery.query_id !== props.row.query_id && 'opacity-50'
          )}
        >
          {((props.row.rows_read ?? 0) > 0 ? props.row.rows_read : 0).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'rows_insert',
      name: 'Rows Insert',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div
          className={cn(
            'font-mono text-xs text-right',
            selectedQuery && selectedQuery.query_id !== props.row.query_id && 'opacity-50'
          )}
        >
          {((props.row.rows_insert ?? 0) > 0 ? props.row.rows_insert : 0).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'rows_update',
      name: 'Rows Update',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div
          className={cn(
            'font-mono text-xs text-right',
            selectedQuery && selectedQuery.query_id !== props.row.query_id && 'opacity-50'
          )}
        >
          {((props.row.rows_update ?? 0) > 0 ? props.row.rows_update : 0).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'rows_delete',
      name: 'Rows Delete',
      resizable: true,
      minWidth: 100,
      headerCellClass: '',
      renderCell: (props) => (
        <div
          className={cn(
            'font-mono text-xs text-right',
            selectedQuery && selectedQuery.query_id !== props.row.query_id && 'opacity-50'
          )}
        >
          {((props.row.rows_delete ?? 0) > 0 ? props.row.rows_delete : 0).toLocaleString()}
        </div>
      ),
    },
    {
      key: 'application_name',
      name: 'Application',
      resizable: true,
      minWidth: 120,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs">{props.row.application_name || 'Unknown'}</div>
      ),
    },
    {
      key: 'badness_score',
      name: 'Badness Score',
      resizable: true,
      minWidth: 120,
      headerCellClass: '',
      renderCell: (props) => (
        <div className="font-mono text-xs text-right">
          {(props.row.badness_score ?? 0).toFixed(2)}
        </div>
      ),
    },
    {
      key: 'index_recommendations',
      name: 'Index Recommendations',
      resizable: true,
      minWidth: 160,
      headerCellClass: '',
      renderCell: (props) => {
        const indexStatements = props.row.index_statements
        const hasRecommendations =
          indexStatements !== undefined &&
          Array.isArray(indexStatements) &&
          indexStatements.length > 0

        return (
          <div className="font-mono text-xs">
            {hasRecommendations ? (
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 rounded">
                {indexStatements.length} suggestions
              </span>
            ) : props.row.query.toLowerCase().startsWith('select') ? (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded">
                Optimized
              </span>
            ) : (
              <span className="text-foreground-lighter">N/A</span>
            )}
          </div>
        )
      },
    },
    // {
    //   key: 'database',
    //   name: 'Database',
    //   resizable: true,
    //   minWidth: 120,
    //   headerCellClass: '',
    //   renderCell: (props) => <div className="font-mono text-xs">{props.row.database}</div>,
    // },
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
        rowClass={(row, idx) => {
          // Use the query_id for comparison instead of row index
          const isSelected = selectedQuery?.query_id === row.query_id
          // const isHovered = hoveredQuery?.query_id === row.query_id && !selectedQuery
          return [
            rowClassRender(row),
            `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-4',
          ].join(' ')
        }}
        renderers={{
          renderRow: (rowIdx, props) => {
            const idx = typeof rowIdx === 'number' ? rowIdx : Number(rowIdx)
            return (
              <Row
                {...props}
                key={`qi-row-${rowIdx}`}
                onClick={() => handleRowClick(idx)}
                // Commenting out hover functionality
                // onMouseEnter={() => handleRowMouseEnter(idx)}
                // onMouseLeave={handleRowMouseLeave}
              />
            )
          },
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
