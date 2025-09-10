import { ArrowDown, ArrowUp, TextSearch, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { hasIndexRecommendations } from './index-advisor.utils'
import { IndexSuggestionIcon } from './IndexSuggestionIcon'
import { QueryDetail } from './QueryDetail'
import { QueryIndexes } from './QueryIndexes'
import {
  QUERY_PERFORMANCE_REPORTS,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from './QueryPerformance.constants'

interface QueryPerformanceGridProps {
  queryPerformanceQuery: DbQueryHook<any>
}

// Load the monaco editor client-side only (does not behave well server-side)
const Editor = dynamic(() => import('@monaco-editor/react').then(({ Editor }) => Editor), {
  ssr: false,
})

export const QueryPerformanceGrid = ({ queryPerformanceQuery }: QueryPerformanceGridProps) => {
  const router = useRouter()
  const gridRef = useRef<DataGridHandle>(null)
  const { preset, sort: urlSort, order, roles, search } = useParams()
  const { isLoading, data } = queryPerformanceQuery

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
        if (col.id === 'query') {
          return (
            <div className="w-full flex items-center gap-x-2 pointer-events-none">
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
              <Editor
                height={20}
                theme="supabase"
                language="pgsql"
                value={value.replace(/\s+/g, ' ').trim()}
                wrapperProps={{
                  className:
                    '[&_.monaco-editor]:!bg-transparent [&_.monaco-editor-background]:!bg-transparent [&_.monaco-editor]:!outline-transparent',
                }}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  cursorBlinking: 'solid',
                  tabIndex: -1,
                  fontSize: 12,
                  minimap: { enabled: false },
                  lineNumbers: 'off',
                  renderLineHighlight: 'none',
                  scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                  overviewRulerLanes: 0,
                  overviewRulerBorder: false,
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  wordWrap: 'off',
                  scrollBeyondLastLine: false,
                  contextmenu: false,
                  selectionHighlight: false,
                  occurrencesHighlight: 'off',
                }}
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
            <div className="w-full flex flex-col justify-center font-mono text-xs text-right">
              <p>{value || 'n/a'}</p>
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
        return (
          <div
            className={cn(
              'w-full flex flex-col justify-center font-mono text-xs',
              typeof value === 'number' ? 'text-right' : ''
            )}
          >
            <p>{formattedValue}</p>
            {isTime && typeof value === 'number' && !isNaN(value) && isFinite(value) && (
              <p className="text-foreground-lighter">{(value / 1000).toFixed(2)}s</p>
            )}
          </div>
        )
      },
    }
    return result
  })

  const reportData = useMemo(() => data ?? [], [data])
  const selectedQuery = selectedRow !== undefined ? reportData[selectedRow]?.query : undefined
  const query = (selectedQuery ?? '').trim().toLowerCase()
  const showIndexSuggestions =
    (query.startsWith('select') ||
      query.startsWith('with pgrst_source') ||
      query.startsWith('with pgrst_payload')) &&
    hasIndexRecommendations(reportData[selectedRow!]?.index_advisor_result, true)

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
