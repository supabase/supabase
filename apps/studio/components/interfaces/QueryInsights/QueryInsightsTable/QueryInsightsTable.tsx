import { wrapWithRollback } from '@supabase/pg-meta/src/query'
import { useParams } from 'common'
import { Search, TextSearch, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line no-restricted-imports
import DataGrid, { DataGridHandle, Row } from 'react-data-grid'
import { Button, cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { buildQueryInsightFixPrompt } from '../../QueryPerformance/QueryPerformance.ai'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import { useQueryInsightsIssues } from '../hooks/useQueryInsightsIssues'
import { useQueryInsightsTableColumns } from '../hooks/useQueryInsightsTableColumns'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import { QueryInsightsDetailSheet } from './QueryInsightsDetailSheet'
import type { IssueFilter, Mode } from './QueryInsightsTable.types'
import {
  formatDuration,
  getColumnName,
  getQueryType,
  getTableName,
} from './QueryInsightsTable.utils'
import type { QueryPlanRow } from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import { FilterPill } from '@/components/interfaces/QueryPerformance/components/FilterPill'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { FilterPopover } from '@/components/ui/FilterPopover'
import TwoOptionToggle from '@/components/ui/TwoOptionToggle'
import { useExecuteSqlMutation } from '@/data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface QueryInsightsTableProps {
  data: QueryPerformanceRow[]
  isLoading: boolean
  currentSelectedQuery?: string | null
  onCurrentSelectQuery?: (query: string | null) => void
}

export const QueryInsightsTable = ({
  data,
  isLoading,
  currentSelectedQuery,
  onCurrentSelectQuery,
}: QueryInsightsTableProps) => {
  const [mode, setMode] = useState<Mode>('triage')
  const [filter, setFilter] = useState<IssueFilter>('all')
  const [
    { search: urlSearch, sort: urlSortCol, order: urlSortOrder, source: urlSource },
    setQueryStates,
  ] = useQueryStates({
    search: parseAsString.withDefault(''),
    sort: parseAsString,
    order: parseAsString,
    source: parseAsArrayOf(parseAsString).withDefault([]),
  })
  const [searchQuery, setSearchQuery] = useState(urlSearch || '')
  const appNameFilter = urlSource
  const setAppNameFilter = (names: string[]) =>
    setQueryStates({ source: names.length ? names : null })

  const appNameOptions = useMemo(() => {
    const names = Array.from(
      new Set(data.map((r) => r.application_name).filter(Boolean))
    ) as string[]
    return names.map((name) => ({ value: name, label: name }))
  }, [data])

  const filteredData = useMemo(() => {
    if (appNameFilter.length === 0) return data
    return data.filter((r) => appNameFilter.includes(r.application_name ?? ''))
  }, [data, appNameFilter])

  const { classified, errors, indexIssues, slowQueries } = useQueryInsightsIssues(filteredData)
  const [selectedRow, setSelectedRow] = useState<number>()
  const [selectedTriageRow, setSelectedTriageRow] = useState<number | undefined>()
  const [sheetView, setSheetView] = useState<'details' | 'indexes' | 'explain'>('details')
  const gridRef = useRef<DataGridHandle>(null)
  const triageGridRef = useRef<DataGridHandle>(null)
  const dataGridContainerRef = useRef<HTMLDivElement>(null)
  const triageContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [triageContainerWidth, setTriageContainerWidth] = useState(0)
  const sort = useMemo<{ column: string; order: 'asc' | 'desc' }>(
    () =>
      urlSortCol && urlSortOrder && ['asc', 'desc'].includes(urlSortOrder)
        ? { column: urlSortCol, order: urlSortOrder as 'asc' | 'desc' }
        : { column: 'prop_total_time', order: 'desc' },
    [urlSortCol, urlSortOrder]
  )
  const setSort = useCallback(
    (config: { column: string; order: 'asc' | 'desc' } | null) =>
      setQueryStates(
        config ? { sort: config.column, order: config.order } : { sort: null, order: null }
      ),
    [setQueryStates]
  )

  const [explainResults, setExplainResults] = useState<Record<string, QueryPlanRow[]>>({})
  const [explainLoadingQuery, setExplainLoadingQuery] = useState<string | null>(null)

  const { ref } = useParams()
  const router = useRouter()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const { data: project } = useSelectedProjectQuery()

  const { mutate: executeExplain } = useExecuteSqlMutation()

  const triageItems = useMemo(() => classified.filter((q) => q.issueType !== null), [classified])

  const filteredTriageItems = useMemo(() => {
    const filtered =
      filter === 'all' ? triageItems : triageItems.filter((q) => q.issueType === filter)
    return filtered.map((item) => ({
      ...item,
      queryType: getQueryType(item.query),
    }))
  }, [triageItems, filter])

  const explorerItems = useMemo(() => {
    let items = [...classified]

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      items = items.filter((item) => {
        const queryType = getQueryType(item.query) ?? ''
        const tableName = getTableName(item.query) ?? ''
        const columnName = getColumnName(item.query) ?? ''
        const appName = item.application_name ?? ''
        const query = item.query ?? ''

        return (
          queryType.toLowerCase().includes(searchLower) ||
          tableName.toLowerCase().includes(searchLower) ||
          columnName.toLowerCase().includes(searchLower) ||
          appName.toLowerCase().includes(searchLower) ||
          query.toLowerCase().includes(searchLower)
        )
      })
    }

    if (sort) {
      items.sort((a, b) => {
        if (sort.column === 'query') {
          const aDate = a.first_seen ? new Date(a.first_seen).getTime() : 0
          const bDate = b.first_seen ? new Date(b.first_seen).getTime() : 0
          return sort.order === 'asc' ? aDate - bDate : bDate - aDate
        }

        const aValue: unknown = a[sort.column as keyof typeof a]
        const bValue: unknown = b[sort.column as keyof typeof b]

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sort.order === 'asc' ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    }

    return items
  }, [classified, searchQuery, sort])

  const activeSheetRow: ClassifiedQuery | undefined = useMemo(() => {
    if (mode === 'triage') {
      return selectedTriageRow !== undefined ? filteredTriageItems[selectedTriageRow] : undefined
    }
    return selectedRow !== undefined ? (explorerItems[selectedRow] as ClassifiedQuery) : undefined
  }, [mode, selectedTriageRow, selectedRow, filteredTriageItems, explorerItems])

  const runExplain = useCallback(
    (query: string) => {
      if (explainResults[query]) return
      if (explainLoadingQuery) return
      const requestQuery = query
      setExplainLoadingQuery(requestQuery)
      executeExplain(
        {
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          sql: wrapWithRollback(`EXPLAIN ANALYZE ${requestQuery}`),
        },
        {
          onSuccess(data) {
            setExplainResults((prev) => ({ ...prev, [requestQuery]: data.result }))
            setExplainLoadingQuery(null)
          },
          onError() {
            setExplainLoadingQuery(null)
          },
        }
      )
    },
    [explainResults, explainLoadingQuery, executeExplain, project]
  )

  const handleGoToLogs = useCallback(() => {
    router.push(`/project/${ref}/logs/postgres-logs`)
  }, [router, ref])

  const handleAiSuggestedFix = useCallback(
    (item: ClassifiedQuery) => {
      const { query, prompt } = buildQueryInsightFixPrompt(item)
      openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      aiSnap.newChat({
        sqlSnippets: [{ label: 'Query', content: query }],
        initialMessage: prompt,
      })
    },
    [openSidebar, aiSnap]
  )

  useEffect(() => {
    if (sheetView === 'explain' && activeSheetRow?.query) {
      runExplain(activeSheetRow.query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetView, activeSheetRow?.query])

  useEffect(() => {
    const currentPath = router.asPath.split('?')[0]
    const handleRouteChange = (url: string) => {
      if (url.split('?')[0] !== currentPath) {
        setQueryStates({ search: null })
        onCurrentSelectQuery?.(null)
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timeConsumedWidth = useMemo(() => {
    if (!explorerItems.length) return 150
    let maxWidth = 150
    explorerItems.forEach((row) => {
      const pct = row.prop_total_time || 0
      const total = row.total_time || 0
      if (pct && total) {
        const text = `${pct.toFixed(1)}% / ${formatDuration(total)}`
        maxWidth = Math.max(maxWidth, text.length * 8 + 40)
      }
    })
    return Math.min(maxWidth, 300)
  }, [explorerItems])

  const triageQueryColWidth = useMemo(() => {
    if (!triageContainerWidth) return 380
    const fixed = timeConsumedWidth + 100 + 300 + 4
    return Math.max(380, triageContainerWidth - fixed - 120)
  }, [triageContainerWidth, timeConsumedWidth])

  const { columns, triageColumns } = useQueryInsightsTableColumns({
    sort,
    setSort,
    timeConsumedWidth,
    triageQueryColWidth,
    gridRef,
    setSelectedRow,
    setSelectedTriageRow,
    setSheetView,
    handleGoToLogs,
    handleAiSuggestedFix,
  })

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!explorerItems.length || selectedRow === undefined) return

      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return

      event.stopPropagation()

      let nextIndex = selectedRow
      if (event.key === 'ArrowUp' && selectedRow > 0) {
        nextIndex = selectedRow - 1
      } else if (event.key === 'ArrowDown' && selectedRow < explorerItems.length - 1) {
        nextIndex = selectedRow + 1
      }

      if (nextIndex !== selectedRow) {
        setSelectedRow(nextIndex)
        gridRef.current?.scrollToCell({ idx: 0, rowIdx: nextIndex })
      }
    },
    [explorerItems, selectedRow]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  useEffect(() => {
    setSelectedRow(undefined)
  }, [searchQuery, sort])

  useEffect(() => {
    if (mode === 'triage') {
      triageGridRef.current?.scrollToCell({ idx: 0, rowIdx: 0 })
    } else {
      gridRef.current?.scrollToCell({ idx: 0, rowIdx: 0 })
    }
  }, [mode])

  useEffect(() => {
    const el = triageContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setTriageContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (urlSearch !== searchQuery) {
      setQueryStates({ search: searchQuery || null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const errorCount = errors.length
  const indexCount = indexIssues.length
  const slowCount = slowQueries.length

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="overflow-x-auto flex-shrink-0 bg-surface-100 border-b">
        <div className="flex items-center justify-between px-6 h-10 min-w-max">
          <div className="flex items-center gap-x-1.5">
            <TwoOptionToggle
              width={75}
              options={['explorer', 'triage']}
              activeOption={mode}
              borderOverride="border"
              onClickOption={setMode}
            />
            {appNameFilter.length > 0 ? (
              <FilterPill
                label="Source"
                value={appNameFilter.join(', ')}
                onClear={() => setAppNameFilter([])}
              />
            ) : (
              <FilterPopover
                name="Source"
                options={appNameOptions}
                activeOptions={appNameFilter}
                valueKey="value"
                labelKey="label"
                onSaveFilters={setAppNameFilter}
                showOnlyButton={false}
              />
            )}
          </div>

          <div className="flex items-center">
            {mode === 'triage' ? (
              <Tabs_Shadcn_ value={filter} onValueChange={(v) => setFilter(v as IssueFilter)}>
                <TabsList_Shadcn_ className="flex gap-x-4 rounded-none !mt-0 pt-0 !border-none">
                  <TabsTrigger_Shadcn_
                    value="all"
                    className="text-xs py-3 border-b-[1px] font-mono uppercase"
                  >
                    All{triageItems.length > 0 && ` (${triageItems.length})`}
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_
                    value="error"
                    className="text-xs py-3 border-b-[1px] font-mono uppercase"
                  >
                    Errors{errorCount > 0 && ` (${errorCount})`}
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_
                    value="index"
                    className="text-xs py-3 border-b-[1px] font-mono uppercase"
                  >
                    Index{indexCount > 0 && ` (${indexCount})`}
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_
                    value="slow"
                    className="text-xs py-3 border-b-[1px] font-mono uppercase"
                  >
                    Slow{slowCount > 0 && ` (${slowCount})`}
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
              </Tabs_Shadcn_>
            ) : (
              <Input
                size="tiny"
                autoComplete="off"
                icon={<Search className="h-4 w-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                name="search"
                id="search"
                placeholder="Search queries..."
                className="w-64"
                actions={[
                  searchQuery && (
                    <Button
                      key="clear"
                      size="tiny"
                      type="text"
                      icon={<X className="h-4 w-4" />}
                      onClick={() => setSearchQuery('')}
                      className="p-0 h-5 w-5"
                    />
                  ),
                ]}
              />
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        <div
          className={[
            'absolute bottom-8 left-0 right-0 flex justify-center z-10 pointer-events-none',
            'transition-all duration-200',
            currentSelectedQuery
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none',
          ].join(' ')}
        >
          <Button
            type="default"
            size="tiny"
            className="rounded-full shadow-md"
            onClick={() => onCurrentSelectQuery?.(null)}
          >
            Clear query
          </Button>
        </div>
        {isLoading ? (
          <div className="px-6 py-4">
            <GenericSkeletonLoader />
          </div>
        ) : mode === 'triage' ? (
          <div ref={triageContainerRef} className="flex-1 min-h-0 min-w-0 overflow-x-auto">
            <DataGrid
              ref={triageGridRef}
              style={{ height: '100%' }}
              className="flex-1 flex-grow h-full"
              rowHeight={60}
              headerRowHeight={36}
              columns={triageColumns}
              rows={filteredTriageItems}
              rowClass={(_, idx) => {
                const isSelected = idx === selectedTriageRow
                const query = filteredTriageItems[idx]?.query
                const isCharted = currentSelectedQuery ? currentSelectedQuery === query : false
                return [
                  `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : isCharted ? 'bg-surface-200 dark:bg-surface-200' : 'bg-200 hover:bg-surface-200'} cursor-pointer`,
                  '[&>div:first-child]:border-l-4 [&>div:first-child]:pl-5 [&>div:last-child]:pr-6',
                  `${isSelected || isCharted ? '[&>div:first-child]:border-l-foreground' : '[&>div:first-child]:border-l-transparent'}`,
                  '[&>.rdg-cell]:box-border [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none [&>.rdg-cell]:py-3',
                  '[&>.rdg-cell.column-prop_total_time]:relative',
                ].join(' ')
              }}
              renderers={{
                renderRow(idx, props) {
                  return (
                    <Row
                      {...props}
                      key={`triage-row-${props.rowIdx}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (typeof idx === 'number' && idx >= 0) {
                          const query = filteredTriageItems[idx]?.query
                          if (query && onCurrentSelectQuery) {
                            onCurrentSelectQuery(currentSelectedQuery === query ? null : query)
                          }
                        }
                      }}
                    />
                  )
                },
                noRowsFallback: (
                  <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                    <TextSearch className="text-foreground-muted" strokeWidth={1} />
                    <div className="text-center">
                      <p className="text-foreground">No issues found</p>
                      <p className="text-foreground-light">
                        {data.length === 0
                          ? 'No query data available yet'
                          : 'No issues detected for the selected filter'}
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        ) : (
          <div ref={dataGridContainerRef} className="flex-1 min-h-0 min-w-0 overflow-x-auto">
            <DataGrid
              ref={gridRef}
              style={{ height: '100%' }}
              className={cn('flex-1 flex-grow h-full')}
              rowHeight={44}
              headerRowHeight={36}
              columns={columns}
              rows={explorerItems}
              rowClass={(_, idx) => {
                const isSelected = idx === selectedRow
                const query = explorerItems[idx]?.query
                const isCharted = currentSelectedQuery ? currentSelectedQuery === query : false
                return [
                  `${isSelected ? 'bg-surface-300 dark:bg-surface-300' : isCharted ? 'bg-surface-200 dark:bg-surface-200' : 'bg-200 hover:bg-surface-200'} cursor-pointer`,
                  '[&>div:first-child]:border-l-4 [&>div:first-child]:pl-5 [&>div:last-child]:pr-6',
                  `${isSelected || isCharted ? '[&>div:first-child]:border-l-foreground' : '[&>div:first-child]:border-l-transparent'}`,
                  '[&>.rdg-cell]:box-border [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none [&>.rdg-cell]:py-3',
                  '[&>.rdg-cell.column-prop_total_time]:relative',
                ].join(' ')
              }}
              renderers={{
                renderRow(idx, props) {
                  return (
                    <Row
                      {...props}
                      key={`explorer-row-${props.rowIdx}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (typeof idx === 'number' && idx >= 0) {
                          const query = explorerItems[idx]?.query
                          if (query && onCurrentSelectQuery) {
                            onCurrentSelectQuery(currentSelectedQuery === query ? null : query)
                          }
                        }
                      }}
                    />
                  )
                },
                noRowsFallback: (
                  <div className="absolute top-20 px-6 flex flex-col items-center justify-center w-full gap-y-2">
                    <TextSearch className="text-foreground-muted" strokeWidth={1} />
                    <div className="text-center">
                      <p className="text-foreground">No queries found</p>
                      <p className="text-foreground-light">
                        {searchQuery.trim()
                          ? 'No queries match your search criteria'
                          : 'No query data available yet'}
                      </p>
                    </div>
                  </div>
                ),
              }}
            />
          </div>
        )}
      </div>

      <QueryInsightsDetailSheet
        open={activeSheetRow !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTriageRow(undefined)
            setSelectedRow(undefined)
          }
        }}
        activeSheetRow={activeSheetRow}
        sheetView={sheetView}
        onSheetViewChange={setSheetView}
        onClose={() => {
          setSelectedTriageRow(undefined)
          setSelectedRow(undefined)
        }}
        dataGridContainerRef={dataGridContainerRef}
        triageContainerRef={triageContainerRef}
        explainLoadingQuery={explainLoadingQuery}
        explainResults={explainResults}
      />
    </div>
  )
}
