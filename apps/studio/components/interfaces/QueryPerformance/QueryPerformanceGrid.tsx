import { ArrowDown, ArrowUp, ChevronDown, TextSearch, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
  CodeBlock,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { hasIndexRecommendations } from './index-advisor.utils'
import { IndexSuggestionIcon } from './IndexSuggestionIcon'
import { QueryDetail } from './QueryDetail'
import { QueryIndexes } from './QueryIndexes'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'

interface QueryPerformanceGridProps {
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformanceGrid = ({ queryPerformanceQuery }: QueryPerformanceGridProps) => {
  const { sort, setSortConfig } = useQueryPerformanceSort()
  const gridRef = useRef<DataGridHandle>(null)
  const { preset, sort: urlSort, order, roles, search } = useParams()
  const { isLoading, data } = queryPerformanceQuery

  const [view, setView] = useState<'details' | 'suggestion'>('details')
  const [selectedRow, setSelectedRow] = useState<number>()
  const reportType =
    (preset as QUERY_PERFORMANCE_REPORT_TYPES) ?? QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING

  const columns = QUERY_PERFORMANCE_REPORTS[reportType].map((col) => {
    const nonSortableColumns = ['query']

    const result: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: true,
      minWidth: col.minWidth ?? 120,
      sortable: !nonSortableColumns.includes(col.id),
      headerCellClass: 'first:pl-6 cursor-pointer',
      renderHeaderCell: () => {
        const isSortable = !nonSortableColumns.includes(col.id)

        return (
          <div className="flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground font-medium">{col.name}</p>
              {col.description && (
                <p className="text-foreground-lighter font-normal">{col.description}</p>
              )}
            </div>

            {isSortable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="text"
                    size="tiny"
                    className="p-1 h-5 w-5 flex-shrink-0"
                    icon={<ChevronDown size={14} className="text-foreground-muted" />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setSortConfig(col.id, 'asc')
                    }}
                    className={cn(
                      'flex gap-2',
                      sort?.column === col.id && sort?.order === 'asc' && 'text-foreground'
                    )}
                  >
                    <ArrowUp size={14} />
                    Sort Ascending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortConfig(col.id, 'desc')
                    }}
                    className={cn(
                      'flex gap-2',
                      sort?.column === col.id && sort?.order === 'desc' && 'text-foreground'
                    )}
                  >
                    <ArrowDown size={14} />
                    Sort Descending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.[col.id]
        if (col.id === 'query') {
          return (
            <div className="w-full flex items-center gap-x-3">
              {hasIndexRecommendations(props.row.index_advisor_result, true) && (
                <IndexSuggestionIcon
                  indexAdvisorResult={props.row.index_advisor_result}
                  onClickIcon={() => {
                    setSelectedRow(props.rowIdx)
                    setView('suggestion')
                    gridRef.current?.scrollToCell({ idx: 0, rowIdx: props.rowIdx })
                  }}
                />
              )}
              <CodeBlock
                language="pgsql"
                className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap [&>code]:!whitespace-nowrap [&>code]:break-words !overflow-visible !truncate !w-full !pr-8 flex-grow pointer-events-none"
                wrapperClassName="!max-w-full"
                hideLineNumbers
                hideCopy
                value={value.replace(/\s+/g, ' ').trim() as string}
                wrapLines={false}
              />
            </div>
          )
        }

        if (col.id === 'rolname') {
          return (
            <div className="w-full flex flex-col justify-center font-mono text-xs">
              <p>{value || 'n/a'}</p>
            </div>
          )
        }

        if (col.id === 'prop_total_time') {
          return (
            <div className="w-full flex flex-col justify-center text-xs">
              <p>{value ? `${value.toFixed(1)}%` : 'n/a'}</p>
            </div>
          )
        }

        const isTime = col.name.includes('time')
        const formattedValue =
          !!value && typeof value === 'number' && !isNaN(value) && isFinite(value)
            ? isTime
              ? `${value.toFixed(0)}ms`
              : value.toLocaleString()
            : ''

        if (col.id === 'total_time') {
          return (
            <div className="w-full flex flex-col justify-center text-xs">
              {isTime && typeof value === 'number' && !isNaN(value) && isFinite(value) && (
                <p>{(value / 1000).toFixed(2) + 's' || 'n/a'}</p>
              )}
            </div>
          )
        }

        return (
          <div className="w-full flex flex-col gap-y-0.5 justify-center text-xs">
            <p>{formattedValue}</p>
          </div>
        )
      },
    }
    return result
  })

  const reportData = useMemo(() => {
    const rawData = data ?? []

    if (sort?.column === 'prop_total_time') {
      const sortedData = [...rawData].sort((a, b) => {
        const getNumericValue = (value: number | string) => {
          if (!value || value === 'n/a') return 0
          if (typeof value === 'number') return value
          return parseFloat(value.toString().replace('%', '')) || 0
        }

        const aValue = getNumericValue(a.prop_total_time)
        const bValue = getNumericValue(b.prop_total_time)

        return sort.order === 'asc' ? aValue - bValue : bValue - aValue
      })

      return sortedData
    }

    return rawData
  }, [data, sort])
  const selectedQuery = selectedRow !== undefined ? reportData[selectedRow]?.query : undefined
  const query = (selectedQuery ?? '').trim().toLowerCase()
  const showIndexSuggestions =
    (query.startsWith('select') ||
      query.startsWith('with pgrst_source') ||
      query.startsWith('with pgrst_payload')) &&
    hasIndexRecommendations(reportData[selectedRow!]?.index_advisor_result, true)

  useEffect(() => {
    setSelectedRow(undefined)
  }, [preset, search, roles, urlSort, order])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!reportData.length || selectedRow === undefined) return

      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

      // stop default RDG behavior (which moves focus to header when selectedRow is 0)
      event.stopPropagation()

      let nextIndex = selectedRow
      if (event.key === 'ArrowUp' && selectedRow > 0) {
        nextIndex = selectedRow - 1
      } else if (event.key === 'ArrowDown' && selectedRow < reportData.length - 1) {
        nextIndex = selectedRow + 1
      }

      if (nextIndex !== selectedRow) {
        setSelectedRow(nextIndex)
        gridRef.current?.scrollToCell({ idx: 0, rowIdx: nextIndex })

        const rowQuery = reportData[nextIndex]?.query ?? ''
        if (!rowQuery.trim().toLowerCase().startsWith('select')) {
          setView('details')
        }
      }
    },
    [reportData, selectedRow]
  )

  useEffect(() => {
    // run before RDG to prevent header focus (the third param: true)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="relative flex flex-grow bg-alternative min-h-0"
      autoSaveId="query-performance-layout-v1"
    >
      <ResizablePanel defaultSize={1}>
        <DataGrid
          ref={gridRef}
          style={{ height: '100%' }}
          className={cn('flex-1 flex-grow h-full')}
          rowHeight={44}
          headerRowHeight={36}
          columns={columns}
          rows={reportData}
          rowClass={(_, idx) => {
            const isSelected = idx === selectedRow
            return [
              `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
              `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
              '[&>.rdg-cell]:box-border [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
              '[&>.rdg-cell:first-child>div]:ml-4',
            ].join(' ')
          }}
          renderers={{
            renderRow(idx, props) {
              return (
                <Row
                  {...props}
                  key={`qp-row-${props.rowIdx}`}
                  onClick={() => {
                    if (typeof idx === 'number' && idx >= 0) {
                      setSelectedRow(idx)
                      gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })

                      const rowQuery = reportData[idx]?.query ?? ''
                      if (!rowQuery.trim().toLowerCase().startsWith('select')) {
                        setView('details')
                      }
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
                    There are no actively running queries that match the criteria
                  </p>
                </div>
              </div>
            ),
          }}
        />
      </ResizablePanel>
      {selectedRow !== undefined && (
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
                  className="px-0 pb-0 h-full text-xs  data-[state=active]:bg-transparent !shadow-none"
                >
                  Query details
                </TabsTrigger_Shadcn_>
                {showIndexSuggestions && (
                  <TabsTrigger_Shadcn_
                    value="suggestion"
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
                <QueryDetail
                  reportType={reportType}
                  selectedRow={reportData[selectedRow]}
                  onClickViewSuggestion={() => setView('suggestion')}
                />
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="suggestion"
                className="mt-0 flex-grow min-h-0 overflow-y-auto"
              >
                <QueryIndexes selectedRow={reportData[selectedRow]} />
              </TabsContent_Shadcn_>
            </Tabs_Shadcn_>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
