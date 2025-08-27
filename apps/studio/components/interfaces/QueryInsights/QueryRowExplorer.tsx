import { ArrowDown, ArrowUp, TextSearch, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useQueryInsightsQueries, type QueryInsightsQuery } from 'data/query-insights/query-metrics-query'

interface QueryRowExplorerProps {
  startTime: string
  endTime: string
}

export const QueryRowExplorer = ({ startTime, endTime }: QueryRowExplorerProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: queries, isLoading, error } = useQueryInsightsQueries(ref, startTime, endTime)

  // Debug logging
  console.log('QueryRowExplorer Debug:', {
    ref,
    startTime,
    endTime,
    queries,
    isLoading,
    error,
    queriesLength: queries?.length
  })

  const [sort, setSort] = useState<{ column: string; order: 'asc' | 'desc' } | undefined>({
    column: 'badness_score',
    order: 'desc',
  })
  const [selectedRow, setSelectedRow] = useState<number>()
  const [view, setView] = useState<'details' | 'indexes'>('details')

  // Define columns similar to QueryPerformance
  const columns: Column<QueryInsightsQuery>[] = [
    {
      key: 'query',
      name: 'Query',
      resizable: true,
      minWidth: 600,
      headerCellClass: 'first:pl-6 cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('query')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Query</p>
            </div>
            {sort?.column === 'query' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.query
        return (
          <div className="w-full flex items-center gap-x-2">
            <div className="font-mono text-xs">{value}</div>
          </div>
        )
      },
    },
    {
      key: 'database',
      name: 'Database',
      resizable: true,
      minWidth: 120,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('database')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Database</p>
            </div>
            {sort?.column === 'database' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.database
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs">
            <p>{value}</p>
          </div>
        )
      },
    },
    {
      key: 'calls',
      name: 'Calls',
      resizable: true,
      minWidth: 100,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('calls')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Calls</p>
            </div>
            {sort?.column === 'calls' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.calls
        const formattedValue = value?.toLocaleString() || ''
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
            <p>{formattedValue}</p>
          </div>
        )
      },
    },
    {
      key: 'total_time',
      name: 'Total time',
      resizable: true,
      minWidth: 180,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('total_time')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Total time</p>
              <p className="text-foreground-lighter">latency</p>
            </div>
            {sort?.column === 'total_time' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.total_time
        const formattedValue = value ? `${value.toFixed(0)}ms` : ''
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
            <p>{formattedValue}</p>
            {value && (
              <p className="text-foreground-lighter">{(value / 1000).toFixed(2)}s</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'mean_exec_time',
      name: 'Mean time',
      resizable: true,
      minWidth: 150,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('mean_exec_time')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Mean time</p>
            </div>
            {sort?.column === 'mean_exec_time' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.mean_exec_time
        const formattedValue = value ? `${value.toFixed(0)}ms` : ''
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
            <p>{formattedValue}</p>
            {value && (
              <p className="text-foreground-lighter">{(value / 1000).toFixed(2)}s</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'rows_read',
      name: 'Rows read',
      resizable: true,
      minWidth: 120,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('rows_read')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Rows read</p>
            </div>
            {sort?.column === 'rows_read' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.rows_read
        const formattedValue = value?.toLocaleString() || ''
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
            <p>{formattedValue}</p>
          </div>
        )
      },
    },
    {
      key: 'badness_score',
      name: 'Badness score',
      resizable: true,
      minWidth: 150,
      headerCellClass: 'cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange('badness_score')}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">Badness score</p>
            </div>
            {sort?.column === 'badness_score' && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.badness_score
        const formattedValue = value ? value.toFixed(2) : ''
        return (
          <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
            <p>{formattedValue}</p>
          </div>
        )
      },
    },
  ]

  // For debugging - show test data if no queries found
  const reportData = queries?.length ? queries : [
    {
      query_id: 1,
      query: 'SELECT * FROM test_table WHERE id = 1',
      total_time: 150.5,
      calls: 10,
      rows_read: 1000,
      rows_insert: 0,
      rows_update: 0,
      rows_delete: 0,
      shared_blks_read: 50,
      shared_blks_hit: 950,
      mean_exec_time: 15.05,
      database: 'postgres',
      timestamp: new Date().toISOString(),
      cmd_type_text: 'SELECT',
      application_name: 'Test App',
      badness_score: 25.5,
      error_count: 0
    } as QueryInsightsQuery
  ]
  const selectedQuery = selectedRow !== undefined ? reportData[selectedRow] : undefined

  const onSortChange = (column: string) => {
    let updatedSort: { column: string; order: 'asc' | 'desc' } | undefined = undefined

    if (sort?.column === column) {
      if (sort.order === 'desc') {
        updatedSort = { column, order: 'asc' as const }
      } else {
        updatedSort = undefined
      }
    } else {
      updatedSort = { column, order: 'desc' as const }
    }

    setSort(updatedSort)
  }

  // Sort data based on current sort state
  const sortedData = [...reportData].sort((a, b) => {
    if (!sort) return 0

    const aValue = a[sort.column as keyof QueryInsightsQuery]
    const bValue = b[sort.column as keyof QueryInsightsQuery]

    if (aValue === undefined || bValue === undefined) return 0

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sort.order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sort.order === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  useEffect(() => {
    setSelectedRow(undefined)
  }, [startTime, endTime])

  return (
    <div className="border-t bg-surface-100 flex flex-col h-full">
      <div className="px-4 py-2 border-b flex justify-between items-center">
        <span>Search</span>
        <span>Filters</span>
      </div>
      
      <ResizablePanelGroup
        direction="horizontal"
        className="relative flex flex-grow bg-alternative min-h-0"
        autoSaveId="query-row-explorer-layout-v1"
      >
        <ResizablePanel defaultSize={1}>
          <DataGrid
            ref={gridRef}
            style={{ height: '100%' }}
            className={cn('flex-1 flex-grow h-full')}
            rowHeight={44}
            headerRowHeight={36}
            columns={columns}
            rows={sortedData}
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
              renderRow(idx, props) {
                return (
                  <Row
                    {...props}
                    key={`qre-row-${props.rowIdx}`}
                    onClick={() => {
                      if (typeof idx === 'number' && idx >= 0) {
                        setSelectedRow(idx)
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      }
                    }}
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
                      There are no queries that match the criteria in the selected time range
                    </p>
                  </div>
                </div>
              ),
            }}
          />
        </ResizablePanel>
        {selectedRow !== undefined && selectedQuery && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} maxSize={45} minSize={30} className="bg-studio border-t">
              <Button
                type="text"
                className="absolute top-3 right-3 px-1"
                icon={<X />}
                onClick={() => setSelectedRow(undefined)}
              />
              <Tabs_Shadcn_
                value={view}
                className="flex flex-col h-full"
                onValueChange={(value: any) => setView(value)}
              >
                <TabsList_Shadcn_ className="px-5 flex gap-x-4 min-h-[46px]">
                  <TabsTrigger_Shadcn_
                    value="details"
                    className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
                  >
                    Query details
                  </TabsTrigger_Shadcn_>
                  {selectedQuery.index_statements && selectedQuery.index_statements.length > 0 && (
                    <TabsTrigger_Shadcn_
                      value="indexes"
                      className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
                    >
                      Indexes
                    </TabsTrigger_Shadcn_>
                  )}
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_
                  value="details"
                  className="mt-0 flex-grow min-h-0 overflow-y-auto"
                >
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Query</h4>
                      <pre className="text-xs bg-surface-200 p-3 rounded overflow-x-auto">
                        {selectedQuery.query}
                      </pre>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Database</h5>
                        <p className="text-sm">{selectedQuery.database}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Command Type</h5>
                        <p className="text-sm">{selectedQuery.cmd_type_text}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Application</h5>
                        <p className="text-sm">{selectedQuery.application_name}</p>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Timestamp</h5>
                        <p className="text-sm">{new Date(selectedQuery.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Performance</h5>
                        <div className="space-y-1">
                          <p className="text-xs">Total time: {selectedQuery.total_time?.toFixed(2)}ms</p>
                          <p className="text-xs">Mean time: {selectedQuery.mean_exec_time?.toFixed(2)}ms</p>
                          <p className="text-xs">Calls: {selectedQuery.calls?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-foreground-light mb-1">Rows</h5>
                        <div className="space-y-1">
                          <p className="text-xs">Read: {selectedQuery.rows_read?.toLocaleString()}</p>
                          <p className="text-xs">Insert: {selectedQuery.rows_insert?.toLocaleString()}</p>
                          <p className="text-xs">Update: {selectedQuery.rows_update?.toLocaleString()}</p>
                          <p className="text-xs">Delete: {selectedQuery.rows_delete?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-foreground-light mb-1">Cache Performance</h5>
                      <div className="space-y-1">
                        <p className="text-xs">Blocks read: {selectedQuery.shared_blks_read?.toLocaleString()}</p>
                        <p className="text-xs">Blocks hit: {selectedQuery.shared_blks_hit?.toLocaleString()}</p>
                        <p className="text-xs">Hit ratio: {selectedQuery.shared_blks_hit && selectedQuery.shared_blks_read 
                          ? ((selectedQuery.shared_blks_hit / (selectedQuery.shared_blks_hit + selectedQuery.shared_blks_read)) * 100).toFixed(1) + '%'
                          : 'N/A'}</p>
                      </div>
                    </div>

                    {selectedQuery.error_count && selectedQuery.error_count > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-500 mb-1">Errors</h5>
                        <p className="text-xs text-red-500">{selectedQuery.error_count} slow queries detected</p>
                      </div>
                    )}
                  </div>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_
                  value="indexes"
                  className="mt-0 flex-grow min-h-0 overflow-y-auto"
                >
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Index Recommendations</h4>
                      {selectedQuery.index_statements && selectedQuery.index_statements.length > 0 ? (
                        <div className="space-y-3">
                                                 {selectedQuery.index_statements.map((statement: string, index: number) => (
                         <div key={index} className="bg-surface-200 p-3 rounded">
                           <pre className="text-xs overflow-x-auto">{statement}</pre>
                         </div>
                       ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-light">No index recommendations available</p>
                      )}
                    </div>

                    {selectedQuery.errors && selectedQuery.errors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-500 mb-2">Index Advisor Errors</h4>
                        <div className="space-y-2">
                                                   {selectedQuery.errors.map((error: string, index: number) => (
                           <div key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded">
                             {error}
                           </div>
                         ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
