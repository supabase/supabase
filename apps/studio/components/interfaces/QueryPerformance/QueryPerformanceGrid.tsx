import { ArrowDown, ArrowUp, TextSearch, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
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
import { QueryPerformanceSort } from '../Reports/Reports.queries'
import { QueryDetail } from './QueryDetail'
import { QueryIndexes } from './QueryIndexes'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryPerformanceGridProps {
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformanceGrid = ({ queryPerformanceQuery }: QueryPerformanceGridProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const { preset, sort: urlSort, order, roles, search } = useParams()
  const { isLoading } = queryPerformanceQuery

  const defaultSortValue = router.query.sort
    ? ({ column: router.query.sort, order: router.query.order } as QueryPerformanceSort)
    : undefined

  const [view, setView] = useState<'details' | 'suggestion'>('details')
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
        const formattedValue = isTime
          ? `${Number(value.toFixed(2)).toLocaleString()}ms`
          : value.toLocaleString()
        return (
          <div
            className={cn(
              'w-full flex flex-col justify-center font-mono text-xs',
              typeof value === 'number' ? 'text-right' : ''
            )}
          >
            <p>{formattedValue}</p>
            {isTime && <p className="text-foreground-lighter">{(value / 1000).toFixed(2)}s</p>}
          </div>
        )
      },
    }
    return result
  })

  const selectedQuery =
    selectedRow !== undefined ? queryPerformanceQuery.data?.[selectedRow]?.['query'] : undefined
  const query = (selectedQuery ?? '').trim().toLowerCase()
  const showIndexSuggestions = query.startsWith('select') || query.startsWith('with pgrst_source')

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
  }, [preset, search, roles, urlSort, order])

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
          rows={queryPerformanceQuery?.data ?? []}
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
                  key={`qp-row-${props.rowIdx}`}
                  onClick={() => {
                    if (typeof idx === 'number' && idx >= 0) {
                      setSelectedRow(idx)
                      gridRef.current?.scrollToCell({ idx: 0, rowIdx: idx })

                      const selectedQuery = queryPerformanceQuery.data[idx]['query']
                      if (!(selectedQuery ?? '').trim().toLowerCase().startsWith('select')) {
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
                  selectedRow={queryPerformanceQuery.data?.[selectedRow]}
                  onClickViewSuggestion={() => setView('suggestion')}
                />
              </TabsContent_Shadcn_>
              <TabsContent_Shadcn_
                value="suggestion"
                className="mt-0 flex-grow min-h-0 overflow-y-auto"
              >
                <QueryIndexes selectedRow={queryPerformanceQuery.data?.[selectedRow]} />
              </TabsContent_Shadcn_>
            </Tabs_Shadcn_>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
