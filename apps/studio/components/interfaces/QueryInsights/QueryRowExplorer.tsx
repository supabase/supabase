import { Search, TextSearch, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState, useMemo } from 'react'
import DataGrid, { DataGridHandle, Row } from 'react-data-grid'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
//import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { cn } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FilterPopover } from 'components/ui/FilterPopover'
import {
  useInsightsQueriesQuery,
  type InsightsQuery,
} from 'data/query-insights/insights-queries-query'
import { ColumnConfiguration, QUERY_INSIGHTS_TABLE_COLUMNS } from './QueryInsights.constants'
import { formatQueryInsightsColumns } from './QueryInsights.utils'

interface QueryRowExplorerProps {
  startTime: string
  endTime: string
  onQuerySelect?: (query: InsightsQuery | undefined) => void
  selectedQueryId?: number
}

export const QueryRowExplorer = ({
  startTime,
  endTime,
  onQuerySelect,
  selectedQueryId,
}: QueryRowExplorerProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const { ref } = useParams()
  // const { data: project } = useSelectedProjectQuery()

  const {
    data: queries,
    isLoading,
    error,
  } = useInsightsQueriesQuery(ref, startTime, endTime, {
    enabled: !!ref,
  })

  const [sort, setSort] = useState<{ column: string; order: 'asc' | 'desc' } | undefined>({
    column: 'last_run',
    order: 'desc',
  })
  const [selectedRow, setSelectedRow] = useState<number>()
  const [filterText, setFilterText] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const [
    columnConfiguration,
    setColumnConfiguration,
    { isSuccess: isSuccessStorage, isError: isErrorStorage, error: errorStorage },
  ] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_INSIGHTS_COLUMNS_CONFIGURATION(ref ?? ''),
    null as ColumnConfiguration[] | null
  )

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

  const columns = formatQueryInsightsColumns({
    config: columnConfiguration ?? [],
    visibleColumns: selectedColumns,
    sort,
    onSortChange,
  })

  const reportData = queries || []

  const sortedData = [...reportData].sort((a, b) => {
    if (!sort) return 0

    const aValue = a[sort.column as keyof InsightsQuery]
    const bValue = b[sort.column as keyof InsightsQuery]

    if (aValue === undefined || bValue === undefined) return 0

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sort.order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sort.order === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const filteredData = filterText.trim()
    ? sortedData.filter((query) => query.query.toLowerCase().includes(filterText.toLowerCase()))
    : sortedData

  const selectedQuery = useMemo(() => {
    return selectedRow !== undefined ? filteredData[selectedRow] : undefined
  }, [selectedRow, filteredData])

  useEffect(() => {
    if (selectedQueryId !== undefined) {
      const index = filteredData.findIndex((query) => query.query_id === selectedQueryId)
      if (index !== -1) {
        setSelectedRow(index)
        gridRef.current?.scrollToCell({ idx: 0, rowIdx: index })
      }
    } else {
      setSelectedRow(undefined)
    }
  }, [selectedQueryId, filteredData])

  useEffect(() => {
    setSelectedRow(undefined)
  }, [startTime, endTime])

  useEffect(() => {
    if (columnConfiguration && columnConfiguration.length > 0) {
      setSelectedColumns(columnConfiguration.map((c) => c.id))
    } else {
      setSelectedColumns([])
    }
  }, [columnConfiguration])

  return (
    <div className="border-t bg-surface-100 flex flex-col h-96 overflow-auto">
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <Input
          size="tiny"
          placeholder="Filter by query keywords..."
          icon={<Search size={14} />}
          className="w-52"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <FilterPopover
          name={selectedColumns.length === 0 ? 'All columns' : 'Columns'}
          title="Select columns to show"
          buttonType={selectedColumns.length === 0 ? 'dashed' : 'default'}
          options={QUERY_INSIGHTS_TABLE_COLUMNS}
          labelKey="name"
          valueKey="id"
          labelClass="text-xs"
          maxHeightClass="h-[190px]"
          clearButtonText="Reset"
          activeOptions={selectedColumns}
          onSaveFilters={(value) => {
            let updatedConfig = (columnConfiguration ?? []).slice()
            if (value.length === 0) {
              updatedConfig = QUERY_INSIGHTS_TABLE_COLUMNS.map((c) => ({
                id: c.id,
                width: c.width,
              }))
            } else {
              value.forEach((col) => {
                const hasExisting = updatedConfig.find((c) => c.id === col)
                if (!hasExisting)
                  updatedConfig.push({
                    id: col,
                    width: QUERY_INSIGHTS_TABLE_COLUMNS.find((c) => c.id === col)?.width,
                  })
              })
            }

            setSelectedColumns(value)
            setColumnConfiguration(updatedConfig)
          }}
        />
      </div>

      <div className="flex flex-grow bg-alternative min-h-0">
        <DataGrid
          ref={gridRef}
          style={{ height: '100%' }}
          className={cn('flex-1 flex-grow h-full')}
          rowHeight={44}
          headerRowHeight={36}
          columns={columns}
          rows={filteredData}
          // onRowsChange={(newRows) => {
          // console.log('DataGrid rows changed:', newRows.length)
          //}}
          rowClass={(row, idx) => {
            const isSelected = idx === selectedRow
            const slownessRating = row.slowness_rating
            const isSlowQuery =
              slownessRating === 'NOTICEABLE' ||
              slownessRating === 'SLOW' ||
              slownessRating === 'CRITICAL'

            return [
              `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : isSlowQuery ? 'bg-warning/10 hover:bg-warning/20' : 'bg-200'} cursor-pointer`,
              `${isSelected ? '[&>div:first-child]:border-l-4 border-l-secondary [&>div]:border-l-foreground' : ''}`,
              `${isSelected && isSlowQuery ? '[&>div]:border-l-warning' : ''}`,
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
                    if (typeof idx === 'number' && idx >= 0 && idx < filteredData.length) {
                      const query = filteredData[idx]
                      const isAlreadySelected = selectedQuery?.query_id === query.query_id

                      if (isAlreadySelected) {
                        setSelectedRow(undefined)
                        onQuerySelect?.(undefined)
                      } else {
                        setSelectedRow(idx)
                        onQuerySelect?.(query)
                        gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })
                      }
                    }
                  }}
                />
              )
            },
            noRowsFallback: isLoading ? (
              <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                <LoaderCircle className="h-6 w-6 animate-spin text-foreground-muted" />
                <p className="text-foreground-light text-sm">Loading...</p>
              </div>
            ) : (
              <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                <TextSearch className="text-foreground-muted" strokeWidth={1} />
                <div className="text-center">
                  <p className="text-foreground">
                    {filterText ? 'No queries found' : 'No queries detected'}
                  </p>
                  <p className="text-foreground-light">
                    {filterText
                      ? `No queries match "${filterText}" in the selected time range`
                      : 'There are no queries that match the criteria in the selected time range'}
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
