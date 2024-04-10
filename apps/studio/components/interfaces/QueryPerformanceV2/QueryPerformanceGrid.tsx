import { ArrowDown, ArrowUp, TextSearch, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import DataGrid, { Column } from 'react-data-grid'

import { useParams } from 'common'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import {
  Button,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { QueryPerformanceSort } from '../Reports/Reports.queries'
import { QueryIndexes } from './QueryIndexes'
import { QueryDetail } from './QueryDetail'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryPerformanceGridProps {
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformanceGrid = ({ queryPerformanceQuery }: QueryPerformanceGridProps) => {
  const router = useRouter()
  const { preset } = useParams()
  const { isLoading } = queryPerformanceQuery

  const defaultSortValue = router.query.sort
    ? ({ column: router.query.sort, order: router.query.order } as QueryPerformanceSort)
    : undefined

  const [view, setView] = useState<'details' | 'indexes'>('details')
  const [sort, setSort] = useState<QueryPerformanceSort | undefined>(defaultSortValue)
  const [selectedRow, setSelectedRow] = useState<number>()
  const reportType =
    (preset as QUERY_PERFORMANCE_REPORT_TYPES) ?? QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING

  const columns = QUERY_PERFORMANCE_REPORTS[reportType].map((col) => {
    const result: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: true,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'first:pl-6 cursor-pointer',
      renderHeaderCell: () => {
        return (
          <div
            className="flex items-center justify-between font-mono font-normal text-xs w-full"
            onClick={() => onSortChange(col.id)}
          >
            <div className="flex items-center gap-x-2">
              <p className="!text-foreground">{col.name}</p>
              {col.description && <p className="text-foreground-lighter">{col.description}</p>}
            </div>
            {sort?.column === col.id && (
              <>{sort.order === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</>
            )}
          </div>
        )
      },
      renderCell: (props) => {
        const value = props.row?.[col.id]
        const isTime = col.name.includes('time')
        const formattedValue = isTime ? `${value.toFixed(2)}ms` : String(value)
        return (
          <div className="flex flex-col justify-center font-mono text-xs">
            <p>{formattedValue}</p>
            {isTime && <p className="text-foreground-lighter">{(value / 1000).toFixed(2)}s</p>}
          </div>
        )
      },
    }
    return result
  })

  // [Joshen] This will come in another PR to integrate index advisor
  const selectedQuery =
    selectedRow !== undefined ? queryPerformanceQuery.data[selectedRow]['query'] : undefined
  const showIndexSuggestions = (selectedQuery ?? '').trim().toLowerCase().startsWith('select')

  const onSortChange = (column: string) => {
    let updatedSort = undefined

    if (sort?.column === column) {
      if (sort.order === 'desc') {
        updatedSort = { column, order: 'asc' }
      } else {
        updatedSort = undefined
      }
    } else {
      updatedSort = { column, order: 'desc' }
    }

    setSort(updatedSort as QueryPerformanceSort)

    if (updatedSort === undefined) {
      const { sort, order, ...otherParams } = router.query
      router.push({ ...router, query: otherParams })
    } else {
      router.push({
        ...router,
        query: { ...router.query, sort: updatedSort.column, order: updatedSort.order },
      })
    }
  }

  useEffect(() => {
    setSelectedRow(undefined)
  }, [preset])

  return (
    <div className="relative flex flex-grow bg-black/20 min-h-0">
      <DataGrid
        style={{ height: '100%' }}
        className={cn('flex-1 flex-grow h-full')}
        rowHeight={44}
        headerRowHeight={36}
        onSelectedCellChange={(props) => {
          const { rowIdx } = props
          if (rowIdx >= 0) {
            setSelectedRow(rowIdx)
            if (!props.row.query.trim().toLowerCase().startsWith('select')) setView('details')
          }
        }}
        columns={columns}
        rows={queryPerformanceQuery?.data ?? []}
        rowClass={(_, idx) => {
          const isSelected = idx === selectedRow
          return [
            `${isSelected ? 'bg-surface-100' : 'bg-transparent'} cursor-pointer`,
            `${isSelected ? '[&>div:first-child]:border-l-4 [&>div]:border-l-white' : ''}`,
            '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
            '[&>.rdg-cell:first-child>div]:ml-4',
          ].join(' ')
        }}
        renderers={{
          noRowsFallback: isLoading ? (
            <div className="absolute top-14 px-6 w-full">
              <GenericSkeletonLoader />
            </div>
          ) : (
            <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
              <TextSearch />
              <div className="text-center">
                <p>No queries detected yet</p>
                <p className="text-foreground-light">
                  There are no queries actively running that meet the criteria
                </p>
              </div>
            </div>
          ),
        }}
      />
      {selectedRow !== undefined && (
        <div className="w-[500px] pt-2 bg-studio border-l shadow-lg">
          <Button
            type="text"
            className="absolute top-2 right-2 px-1"
            icon={<X size={14} />}
            onClick={() => setSelectedRow(undefined)}
          />
          <Tabs_Shadcn_
            value={view}
            className="flex flex-col h-full"
            onValueChange={(value: any) => setView(value)}
          >
            <TabsList_Shadcn_ className="px-4 flex gap-x-4">
              <TabsTrigger_Shadcn_ value="details" className="text-xs px-0">
                Query details
              </TabsTrigger_Shadcn_>
              {showIndexSuggestions && (
                <TabsTrigger_Shadcn_ value="indexes" className="text-xs px-0">
                  Indexes
                </TabsTrigger_Shadcn_>
              )}
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_
              value="details"
              className="mt-0 pt-0 flex-grow min-h-0 overflow-y-auto"
            >
              <QueryDetail
                reportType={reportType}
                selectedRow={queryPerformanceQuery.data[selectedRow]}
              />
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_
              value="indexes"
              className="mt-0 pt-0 flex-grow min-h-0 overflow-y-auto"
            >
              <QueryIndexes selectedRow={queryPerformanceQuery.data[selectedRow]} />
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        </div>
      )}
    </div>
  )
}
