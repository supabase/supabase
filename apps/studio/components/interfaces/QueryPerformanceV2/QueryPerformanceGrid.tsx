import { useEffect, useState } from 'react'
import DataGrid, { Column, RenderRowProps, Row } from 'react-data-grid'

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
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'
import { X } from 'lucide-react'
import { QueryDetail } from './QueryDetail'
import { IndexSuggestion } from './IndexSuggestion'

interface QueryPerformanceGridProps {
  queryPerformanceQuery: DbQueryHook<any>
}

export const QueryPerformanceGrid = ({ queryPerformanceQuery }: QueryPerformanceGridProps) => {
  const showIndexSuggestions = true
  const { preset } = useParams()
  const { isLoading } = queryPerformanceQuery
  const [view, setView] = useState<'details' | 'suggestion'>('details')
  const [selectedRow, setSelectedRow] = useState<number>()
  const reportType =
    (preset as QUERY_PERFORMANCE_REPORT_TYPES) ?? QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING

  const columns = QUERY_PERFORMANCE_REPORTS[reportType].map((col) => {
    const result: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: true,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'first:pl-6',
      renderHeaderCell: () => {
        return (
          <div className="flex items-center font-mono font-normal text-xs gap-x-2">
            <span>{col.name}</span>
            {col.description && <span className="text-foreground-lighter">{col.description}</span>}
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

  useEffect(() => {
    setSelectedRow(undefined)
  }, [preset])

  return (
    <div className="relative flex flex-grow bg-black/20 min-h-0">
      {isLoading ? (
        <div className="px-6 py-4">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <>
          <DataGrid
            style={{ height: '100%' }}
            className={cn('flex-1 flex-grow h-full')}
            rowHeight={44}
            headerRowHeight={36}
            onSelectedCellChange={({ rowIdx }) => {
              if (rowIdx >= 0) setSelectedRow(rowIdx)
            }}
            columns={columns}
            rows={queryPerformanceQuery.data}
            rowClass={(_, idx) => {
              const isSelected = idx === selectedRow
              return [
                `${isSelected ? 'bg-surface-100' : 'bg-transparent'} cursor-pointer`,
                `${isSelected ? '[&>div:first-child]:border-l-4 [&>div]:border-l-white' : ''}`,
                '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                '[&>.rdg-cell:first-child>div]:ml-4',
              ].join(' ')
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
                className="flex flex-col h-full"
                defaultValue={view}
                onValueChange={(value: any) => setView(value)}
              >
                <TabsList_Shadcn_ className="px-4 flex gap-x-4">
                  <TabsTrigger_Shadcn_ value="details" className="text-xs px-0">
                    Query details
                  </TabsTrigger_Shadcn_>
                  {showIndexSuggestions && (
                    <TabsTrigger_Shadcn_ value="suggestion" className="text-xs px-0">
                      Index suggestion
                    </TabsTrigger_Shadcn_>
                  )}
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_
                  value="details"
                  className="mt-0 pt-4 flex-grow min-h-0 overflow-y-auto"
                >
                  <QueryDetail
                    reportType={reportType}
                    selectedRow={queryPerformanceQuery.data[selectedRow]}
                  />
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_
                  value="suggestion"
                  className="mt-0 pt-4 flex-grow min-h-0 overflow-y-auto"
                >
                  <IndexSuggestion />
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
          )}
        </>
      )}
    </div>
  )
}
