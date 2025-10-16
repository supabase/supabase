import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, TextSearch } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  Button,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetTitle,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'
import { hasIndexRecommendations } from './IndexAdvisor/index-advisor.utils'
import { IndexSuggestionIcon } from './IndexAdvisor/IndexSuggestionIcon'
import { QueryDetail } from './QueryDetail'
import { QueryIndexes } from './QueryIndexes'
import {
  QUERY_PERFORMANCE_COLUMNS,
  QUERY_PERFORMANCE_REPORT_TYPES,
  QUERY_PERFORMANCE_ROLE_DESCRIPTION,
} from './QueryPerformance.constants'
import { QueryPerformanceRow } from './QueryPerformance.types'
import { formatDuration } from './QueryPerformance.utils'

interface QueryPerformanceGridProps {
  aggregatedData: QueryPerformanceRow[]
  isLoading: boolean
  currentSelectedQuery?: string | null // Make optional
  onCurrentSelectQuery?: (query: string) => void // Make optional
}

const calculateTimeConsumedWidth = (data: QueryPerformanceRow[]) => {
  if (!data || data.length === 0) return 150

  let maxWidth = 150

  data.forEach((row) => {
    const percentage = row.prop_total_time || 0
    const totalTime = row.total_time || 0

    if (percentage && totalTime) {
      const percentageText = `${percentage.toFixed(1)}%`
      const durationText = formatDuration(totalTime)
      const fullText = `${percentageText} / ${durationText}`
      const estimatedWidth = fullText.length * 8 + 40

      maxWidth = Math.max(maxWidth, estimatedWidth)
    }
  })

  return Math.min(maxWidth, 300)
}

export const QueryPerformanceGrid = ({
  aggregatedData,
  isLoading,
  currentSelectedQuery,
  onCurrentSelectQuery,
}: QueryPerformanceGridProps) => {
  const { sort, setSortConfig } = useQueryPerformanceSort()
  const gridRef = useRef<DataGridHandle>(null)
  const { sort: urlSort, order, roles, search } = useParams()
  const dataGridContainerRef = useRef<HTMLDivElement>(null)

  const [view, setView] = useState<'details' | 'suggestion'>('details')
  const [selectedRow, setSelectedRow] = useState<number>()
  const reportType = QUERY_PERFORMANCE_REPORT_TYPES.UNIFIED

  const columns = QUERY_PERFORMANCE_COLUMNS.map((col) => {
    const nonSortableColumns = ['query']

    const result: Column<any> = {
      key: col.id,
      name: col.name,
      cellClass: `column-${col.id}`,
      resizable: true,
      minWidth:
        col.id === 'prop_total_time'
          ? calculateTimeConsumedWidth((aggregatedData as any) ?? [])
          : col.minWidth ?? 120,
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
            <div className="w-full flex items-center gap-x-3 group">
              <div className="flex-shrink-0 w-4">
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
              </div>
              <CodeBlock
                language="pgsql"
                className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap [&>code]:!whitespace-nowrap [&>code]:break-words !overflow-visible !truncate !w-full !pr-20 pointer-events-none"
                wrapperClassName="!max-w-full flex-1"
                hideLineNumbers
                hideCopy
                value={value.replace(/\s+/g, ' ').trim() as string}
                wrapLines={false}
              />
              {onCurrentSelectQuery && (
                <ButtonTooltip
                  tooltip={{ content: { text: 'Query details' } }}
                  icon={<ArrowRight size={14} />}
                  size="tiny"
                  type="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedRow(props.rowIdx)
                    setView('details')
                    gridRef.current?.scrollToCell({ idx: 0, rowIdx: props.rowIdx })
                  }}
                  className="p-1 flex-shrink-0 -translate-x-2 group-hover:flex hidden"
                />
              )}
            </div>
          )
        }

        const isTime = col.name.includes('time')
        const formattedValue =
          !!value && typeof value === 'number' && !isNaN(value) && isFinite(value)
            ? isTime
              ? `${value.toFixed(0).toLocaleString()}ms`
              : value.toLocaleString()
            : ''

        if (col.id === 'prop_total_time') {
          const percentage = props.row.prop_total_time || 0
          const totalTime = props.row.total_time || 0
          const fillWidth = Math.min(percentage, 100)

          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              <div
                className="absolute inset-0 bg-foreground transition-all duration-200 z-0"
                style={{
                  width: `${fillWidth}%`,
                  opacity: 0.04,
                }}
              />
              {percentage && totalTime ? (
                <span className="flex items-center justify-end gap-x-1.5">
                  <span
                    className={cn(percentage.toFixed(1) === '0.0' && 'text-foreground-lighter')}
                  >
                    {percentage.toFixed(1)}%
                  </span>{' '}
                  <span className="text-muted">/</span>
                  <span
                    className={cn(
                      formatDuration(totalTime) === '0.00s' && 'text-foreground-lighter'
                    )}
                  >
                    {formatDuration(totalTime)}
                  </span>
                </span>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        }

        if (col.id === 'calls') {
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              {typeof value === 'number' && !isNaN(value) && isFinite(value) ? (
                <p className={cn(value === 0 && 'text-foreground-lighter')}>
                  {value.toLocaleString()}
                </p>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        }

        if (col.id === 'max_time' || col.id === 'mean_time' || col.id === 'min_time') {
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              {typeof value === 'number' && !isNaN(value) && isFinite(value) ? (
                <p className={cn(value.toFixed(0) === '0' && 'text-foreground-lighter')}>
                  {Math.round(value).toLocaleString()}ms
                </p>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        }

        if (col.id === 'rows_read') {
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              {typeof value === 'number' && !isNaN(value) && isFinite(value) ? (
                <p className={cn(value === 0 && 'text-foreground-lighter')}>
                  {value.toLocaleString()}
                </p>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        }

        if (col.id === 'cache_hit_rate') {
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              {typeof value === 'number' && !isNaN(value) && isFinite(value) ? (
                <p className={cn(value.toFixed(2) === '0.00' && 'text-foreground-lighter')}>
                  {value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  %
                </p>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        }

        if (col.id === 'rolname') {
          return (
            <div className="w-full flex flex-col justify-center">
              {value ? (
                <span className="flex items-center gap-x-1">
                  <p className="font-mono text-xs">{value}</p>
                  <InfoTooltip align="end" alignOffset={-12} className="w-56">
                    {
                      QUERY_PERFORMANCE_ROLE_DESCRIPTION.find((role) => role.name === value)
                        ?.description
                    }
                  </InfoTooltip>
                </span>
              ) : (
                <p className="text-muted">&ndash;</p>
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
    let data = [...aggregatedData]

    if (search && typeof search === 'string' && search.length > 0) {
      data = data.filter((row) => row.query.toLowerCase().includes(search.toLowerCase()))
    }

    if (roles && Array.isArray(roles) && roles.length > 0) {
      data = data.filter((row) => row.rolname && roles.includes(row.rolname))
    }

    if (sort?.column === 'prop_total_time') {
      data.sort((a, b) => {
        const aValue = a.prop_total_time || 0
        const bValue = b.prop_total_time || 0
        return sort.order === 'asc' ? aValue - bValue : bValue - aValue
      })
    } else if (sort?.column && sort.column !== 'query') {
      data.sort((a, b) => {
        const aValue = a[sort.column as keyof QueryPerformanceRow] || 0
        const bValue = b[sort.column as keyof QueryPerformanceRow] || 0

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sort.order === 'asc' ? aValue - bValue : bValue - aValue
        }
        return 0
      })
    }

    return data
  }, [aggregatedData, sort, search, roles])

  const selectedQuery = selectedRow !== undefined ? reportData[selectedRow]?.query : undefined
  const query = (selectedQuery ?? '').trim().toLowerCase()
  const showIndexSuggestions =
    (query.startsWith('select') ||
      query.startsWith('with pgrst_source') ||
      query.startsWith('with pgrst_payload')) &&
    hasIndexRecommendations(reportData[selectedRow!]?.index_advisor_result, true)

  useEffect(() => {
    setSelectedRow(undefined)
  }, [search, roles, urlSort, order])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!reportData.length || selectedRow === undefined) return

      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

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
    <div className="relative flex flex-grow bg-alternative min-h-0">
      <div ref={dataGridContainerRef} className="flex-1 min-w-0 overflow-x-auto">
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
            const query = reportData[idx]?.query
            const isCharted = currentSelectedQuery ? currentSelectedQuery === query : false

            return [
              `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200'} cursor-pointer`,
              `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:!border-l-foreground' : ''}`,
              `${isCharted ? 'bg-surface-200 dark:bg-surface-200' : ''}`,
              `${isCharted ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-brand' : ''}`,
              '[&>.rdg-cell]:box-border [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
              '[&>.rdg-cell.column-prop_total_time]:relative',
            ].join(' ')
          }}
          renderers={{
            renderRow(idx, props) {
              return (
                <Row
                  {...props}
                  key={`qp-row-${props.rowIdx}`}
                  onClick={(event) => {
                    event.stopPropagation()

                    if (typeof idx === 'number' && idx >= 0) {
                      // If onCurrentSelectQuery is provided, use the chart selection logic
                      if (onCurrentSelectQuery) {
                        const query = reportData[idx]?.query
                        if (query) {
                          onCurrentSelectQuery(query)
                        }
                      } else {
                        // Otherwise, open the detail panel
                        setSelectedRow(idx)
                        setView('details')
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
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
      </div>

      <Sheet
        open={selectedRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRow(undefined)
          }
        }}
        modal={false}
      >
        <SheetTitle className="sr-only">Query details</SheetTitle>
        <SheetContent
          side="right"
          className="flex flex-col h-full bg-studio border-l lg:!w-[calc(100vw-802px)] max-w-[700px] w-full"
          hasOverlay={false}
          onInteractOutside={(event) => {
            if (dataGridContainerRef.current?.contains(event.target as Node)) {
              event.preventDefault()
            }
          }}
        >
          <Tabs_Shadcn_
            value={view}
            className="flex flex-col h-full"
            onValueChange={(value: any) => setView(value)}
          >
            <div className="px-5 border-b">
              <TabsList_Shadcn_ className="px-0 flex gap-x-4 min-h-[46px] border-b-0 [&>button]:h-[47px]">
                <TabsTrigger_Shadcn_
                  value="details"
                  className="px-0 pb-0 data-[state=active]:bg-transparent !shadow-none"
                >
                  Query details
                </TabsTrigger_Shadcn_>
                {showIndexSuggestions && (
                  <TabsTrigger_Shadcn_
                    value="suggestion"
                    className="px-0 pb-0 data-[state=active]:bg-transparent !shadow-none"
                  >
                    Indexes
                  </TabsTrigger_Shadcn_>
                )}
              </TabsList_Shadcn_>
            </div>

            <TabsContent_Shadcn_ value="details" className="mt-0 flex-grow min-h-0 overflow-y-auto">
              {selectedRow !== undefined && (
                <QueryDetail
                  reportType={reportType}
                  selectedRow={reportData[selectedRow]}
                  onClickViewSuggestion={() => setView('suggestion')}
                />
              )}
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_
              value="suggestion"
              className="mt-0 flex-grow min-h-0 overflow-y-auto"
            >
              {selectedRow !== undefined && <QueryIndexes selectedRow={reportData[selectedRow]} />}
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </SheetContent>
      </Sheet>
    </div>
  )
}
