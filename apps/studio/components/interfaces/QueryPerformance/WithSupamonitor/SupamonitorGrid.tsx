import { ArrowDown, ArrowUp, ChevronDown, TextSearch } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import {
  Button,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { Admonition } from 'ui-patterns'
import { useQueryPerformanceSort } from '../hooks/useQueryPerformanceSort'
import { parseAsString, parseAsArrayOf, parseAsJson, useQueryStates } from 'nuqs'
import { NumericFilter } from 'components/interfaces/Reports/v2/ReportsNumericFilter'

interface SupamonitorRow {
  query: string
  calls: number
}

const SUPAMONITOR_COLUMNS = [
  { id: 'query', name: 'Query', minWidth: 500 },
  { id: 'calls', name: 'Calls', minWidth: 100 },
] as const

interface SupamonitorGridProps {
  aggregatedData: SupamonitorRow[]
  isLoading: boolean
  error?: string | null
  currentSelectedQuery?: string | null
  onCurrentSelectQuery?: (query: string) => void
  onRetry?: () => void
}

export const SupamonitorGrid = ({
  aggregatedData,
  isLoading,
  error,
  currentSelectedQuery,
  onCurrentSelectQuery,
  onRetry,
}: SupamonitorGridProps) => {
  const { sort, setSortConfig } = useQueryPerformanceSort()
  const gridRef = useRef<DataGridHandle>(null)
  const { sort: urlSort, order } = useParams()
  const [{ search, roles, callsFilter }] = useQueryStates({
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    callsFilter: parseAsJson<NumericFilter | null>(
      (value) => value as NumericFilter | null
    ).withDefault({
      operator: '>=',
      value: 0,
    } as NumericFilter),
  })
  const dataGridContainerRef = useRef<HTMLDivElement>(null)

  const [selectedRow, setSelectedRow] = useState<number>()

  const columns = SUPAMONITOR_COLUMNS.map((col) => {
    const nonSortableColumns = ['query']

    const result: Column<any> = {
      key: col.id,
      name: col.name,
      cellClass: `column-${col.id}`,
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
              <CodeBlock
                language="pgsql"
                className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap [&>code]:!whitespace-nowrap [&>code]:break-words !overflow-visible !truncate !w-full !pr-20 pointer-events-none"
                wrapperClassName="!max-w-full flex-1"
                hideLineNumbers
                hideCopy
                value={value.replace(/\s+/g, ' ').trim() as string}
                wrapLines={false}
              />
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

        return (
          <div className="w-full flex flex-col gap-y-0.5 justify-center text-xs">
            <p>{value}</p>
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

    if (callsFilter) {
      const { operator, value } = callsFilter
      data = data.filter((row) => {
        const calls = row.calls || 0
        switch (operator) {
          case '=':
            return calls === value
          case '>=':
            return calls >= value
          case '<=':
            return calls <= value
          case '>':
            return calls > value
          case '<':
            return calls < value
          case '!=':
            return calls !== value
          default:
            return true
        }
      })
    }

    if (sort?.column === 'calls') {
      data.sort((a, b) => {
        const aValue = a.calls || 0
        const bValue = b.calls || 0
        return sort.order === 'asc' ? aValue - bValue : bValue - aValue
      })
    }

    return data
  }, [aggregatedData, sort, search, callsFilter])

  useEffect(() => {
    setSelectedRow(undefined)
  }, [search, roles, urlSort, order, callsFilter])

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
      }
    },
    [reportData, selectedRow]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  if (error) {
    return (
      <div className="relative flex flex-grow bg-alternative min-h-0">
        <div className="flex-1 min-w-0 p-6">
          <Admonition
            type="destructive"
            title="Failed to load query performance data"
            description={error}
          >
            {onRetry && (
              <div className="mt-4">
                <Button type="default" onClick={onRetry}>
                  Try again
                </Button>
              </div>
            )}
          </Admonition>
        </div>
      </div>
    )
  }

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
              `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : 'bg-200 hover:bg-surface-200'} cursor-pointer`,
              `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:!border-l-foreground' : ''}`,
              `${isCharted ? 'bg-surface-200 dark:bg-surface-200' : ''}`,
              `${isCharted ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-brand' : ''}`,
              '[&>.rdg-cell]:box-border [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
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
                      if (onCurrentSelectQuery) {
                        const query = reportData[idx]?.query
                        if (query) {
                          onCurrentSelectQuery(query)
                        }
                      } else {
                        setSelectedRow(idx)
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
    </div>
  )
}
