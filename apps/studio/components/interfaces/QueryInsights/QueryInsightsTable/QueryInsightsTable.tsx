import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import {
  Search,
  X,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  TextSearch,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/router'
import { useParams } from 'common'
// eslint-disable-next-line no-restricted-imports
import DataGrid, { Column, DataGridHandle, Row } from 'react-data-grid'
import {
  AiIconAnimation,
  Button,
  CodeBlock,
  Tabs_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { parseAsString, useQueryStates } from 'nuqs'

import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import { useQueryInsightsIssues } from '../hooks/useQueryInsightsIssues'
import type { Mode, IssueFilter } from './QueryInsightsTable.types'
import {
  getQueryType,
  getTableName,
  getColumnName,
  formatDuration,
} from './QueryInsightsTable.utils'
import {
  ISSUE_DOT_COLORS,
  ISSUE_ICONS,
  QUERY_INSIGHTS_EXPLORER_COLUMNS,
  NON_SORTABLE_COLUMNS,
} from './QueryInsightsTable.constants'
import { buildQueryInsightFixPrompt } from '../../QueryPerformance/QueryPerformance.ai'
import { QUERY_PERFORMANCE_ROLE_DESCRIPTION } from '../../QueryPerformance/QueryPerformance.constants'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { wrapWithRollback } from 'data/sql/utils/transaction'
import type { QueryPlanRow } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import { QueryInsightsDetailSheet } from './QueryInsightsDetailSheet'

interface QueryInsightsTableProps {
  data: QueryPerformanceRow[]
  isLoading: boolean
  currentSelectedQuery?: string | null
  onCurrentSelectQuery?: (query: string | null) => void
  showIntrospection?: boolean
  onToggleIntrospection?: () => void
}

export const QueryInsightsTable = ({
  data,
  isLoading,
  currentSelectedQuery,
  onCurrentSelectQuery,
  showIntrospection = false,
  onToggleIntrospection,
}: QueryInsightsTableProps) => {
  const { classified, errors, indexIssues, slowQueries } = useQueryInsightsIssues(data)
  const [mode, setMode] = useState<Mode>('triage')
  const [filter, setFilter] = useState<IssueFilter>('all')
  const [{ search: urlSearch }, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(''),
  })
  const [searchQuery, setSearchQuery] = useState(urlSearch || '')
  const [selectedRow, setSelectedRow] = useState<number>()
  const [selectedTriageRow, setSelectedTriageRow] = useState<number | undefined>()
  const [sheetView, setSheetView] = useState<'details' | 'indexes' | 'explain'>('details')
  const gridRef = useRef<DataGridHandle>(null)
  const triageGridRef = useRef<DataGridHandle>(null)
  const dataGridContainerRef = useRef<HTMLDivElement>(null)
  const triageContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [triageContainerWidth, setTriageContainerWidth] = useState(0)
  const [sort, setSort] = useState<{ column: string; order: 'asc' | 'desc' } | null>({
    column: 'prop_total_time',
    order: 'desc',
  })

  const [explainResults, setExplainResults] = useState<Record<string, QueryPlanRow[]>>({})
  const [explainLoadingQuery, setExplainLoadingQuery] = useState<string | null>(null)
  const explainQueryRef = useRef<string | null>(null)

  const { ref } = useParams()
  const router = useRouter()
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const { data: project } = useSelectedProjectQuery()

  const { mutate: executeExplain } = useExecuteSqlMutation({
    onSuccess(data) {
      const query = explainQueryRef.current
      if (query) {
        setExplainResults((prev) => ({ ...prev, [query]: data.result }))
      }
      setExplainLoadingQuery(null)
    },
    onError() {
      setExplainLoadingQuery(null)
    },
  })

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
      explainQueryRef.current = query
      setExplainLoadingQuery(query)
      executeExplain({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        sql: wrapWithRollback(`EXPLAIN ANALYZE ${query}`),
      })
    },
    [explainResults, executeExplain, project]
  )

  const handleGoToLogs = useCallback(() => {
    router.push(`/project/${ref}/logs?log_type=postgres`)
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

  const columns = useMemo(() => {
    return QUERY_INSIGHTS_EXPLORER_COLUMNS.map((col) => {
      const isSortable = !NON_SORTABLE_COLUMNS.includes(col.id as never)

      const result: Column<ClassifiedQuery> = {
        key: col.id,
        name: col.name,
        cellClass: `column-${col.id}`,
        resizable: true,
        minWidth: col.id === 'prop_total_time' ? timeConsumedWidth : col.minWidth ?? 120,
        sortable: isSortable,
        headerCellClass: 'first:pl-6 cursor-pointer',
        renderHeaderCell: () => {
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
                      onClick={() => setSort({ column: col.id, order: 'asc' })}
                      className={cn(
                        'flex gap-2',
                        sort?.column === col.id && sort?.order === 'asc' && 'text-foreground'
                      )}
                    >
                      <ArrowUp size={14} />
                      Sort Ascending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSort({ column: col.id, order: 'desc' })}
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
          const row = props.row
          const value = row[col.id]

          if (col.id === 'query') {
            const IssueIcon = row.issueType ? ISSUE_ICONS[row.issueType] : null
            return (
              <div className="w-full flex items-center gap-x-3 group">
                <div className="flex-shrink-0 w-6">
                  {row.issueType && IssueIcon && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'h-6 w-6 rounded-full border flex items-center justify-center cursor-default',
                            ISSUE_DOT_COLORS[row.issueType]?.border,
                            ISSUE_DOT_COLORS[row.issueType]?.background
                          )}
                        >
                          <IssueIcon size={14} className={ISSUE_DOT_COLORS[row.issueType].color} />
                        </div>
                      </TooltipTrigger>
                      {row.hint && (
                        <TooltipContent side="top" className="max-w-[260px]">
                          {row.hint}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )}
                </div>
                <CodeBlock
                  language="pgsql"
                  className="!bg-transparent !p-0 !m-0 !border-none !whitespace-nowrap [&>code]:!whitespace-nowrap [&>code]:break-words !overflow-visible !truncate !w-full !pr-20 pointer-events-none"
                  wrapperClassName="!max-w-full flex-1"
                  hideLineNumbers
                  hideCopy
                  value={typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''}
                  wrapLines={false}
                />
                <ButtonTooltip
                  tooltip={{ content: { text: 'Query details' } }}
                  icon={<ArrowRight size={14} />}
                  size="tiny"
                  type="default"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    setSelectedRow(props.rowIdx)
                    setSheetView('details')
                    gridRef.current?.scrollToCell({ idx: 0, rowIdx: props.rowIdx })
                  }}
                  className="p-1 flex-shrink-0 -translate-x-2 group-hover:flex hidden"
                />
              </div>
            )
          }

          if (col.id === 'prop_total_time') {
            const percentage = row.prop_total_time || 0
            const totalTime = row.total_time || 0
            const fillWidth = Math.min(percentage, 100)
            return (
              <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
                <div
                  className="absolute inset-0 bg-foreground transition-all duration-200 z-0"
                  style={{ width: `${fillWidth}%`, opacity: 0.04 }}
                />
                {percentage && totalTime ? (
                  <span className="flex items-center justify-end gap-x-1.5">
                    <span
                      className={cn(percentage.toFixed(1) === '0.0' && 'text-foreground-lighter')}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-muted">/</span>
                    <span
                      className={cn(
                        formatDuration(totalTime) === '0ms' && 'text-foreground-lighter'
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
            const num = typeof value === 'number' ? value : parseFloat(value ?? '0')
            return (
              <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
                {typeof num === 'number' && !isNaN(num) && isFinite(num) ? (
                  <p className={cn(num.toFixed(2) === '0.00' && 'text-foreground-lighter')}>
                    {num.toLocaleString(undefined, {
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
                        QUERY_PERFORMANCE_ROLE_DESCRIPTION.find((r) => r.name === value)
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

          if (col.id === 'application_name') {
            return (
              <div className="w-full flex flex-col justify-center">
                {value ? (
                  <p className="font-mono text-xs">{value}</p>
                ) : (
                  <p className="text-muted">&ndash;</p>
                )}
              </div>
            )
          }

          return null
        },
      }
      return result
    })
  }, [sort, timeConsumedWidth])

  const triageQueryColWidth = useMemo(() => {
    if (!triageContainerWidth) return 380
    const fixed = timeConsumedWidth + 100 + 300 + 4
    return Math.max(380, triageContainerWidth - fixed - 120)
  }, [triageContainerWidth, timeConsumedWidth])

  const triageColumns = useMemo(
    (): Column<ClassifiedQuery>[] => [
      {
        key: 'query',
        name: 'Query',
        minWidth: triageQueryColWidth,
        width: triageQueryColWidth,
        resizable: true,
        headerCellClass: 'first:pl-6 cursor-default',
        renderHeaderCell: () => (
          <div className="flex items-center text-xs w-full">
            <p className="!text-foreground font-medium">Query</p>
          </div>
        ),
        renderCell: (props) => {
          const row = props.row as ClassifiedQuery
          const IssueIcon = row.issueType ? ISSUE_ICONS[row.issueType] : null
          return (
            <div className="w-full flex items-center gap-x-3 group">
              <div className="flex-shrink-0 w-6">
                {row.issueType && IssueIcon && (
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full border flex items-center justify-center',
                      ISSUE_DOT_COLORS[row.issueType]?.border,
                      ISSUE_DOT_COLORS[row.issueType]?.background
                    )}
                  >
                    <IssueIcon size={14} className={ISSUE_DOT_COLORS[row.issueType].color} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground truncate">
                  {row.queryType ?? '–'}
                  {getTableName(row.query) && (
                    <>
                      {' '}
                      <span className="text-foreground-lighter">in</span> {getTableName(row.query)}
                    </>
                  )}
                  {getColumnName(row.query) && (
                    <>
                      <span className="text-foreground-lighter">,</span> {getColumnName(row.query)}
                    </>
                  )}
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5 font-mono truncate',
                    row.issueType === 'error' && 'text-destructive-600',
                    row.issueType === 'index' && 'text-warning-600',
                    row.issueType === 'slow' && 'text-foreground-lighter'
                  )}
                >
                  {row.hint}
                </p>
              </div>
              <ButtonTooltip
                tooltip={{ content: { text: 'Query details' } }}
                icon={<ArrowRight size={14} />}
                size="tiny"
                type="default"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setSelectedTriageRow(props.rowIdx)
                  setSheetView('details')
                }}
                className="p-1 flex-shrink-0 group-hover:flex hidden"
              />
            </div>
          )
        },
      },
      {
        key: 'prop_total_time',
        name: 'Time consumed',
        minWidth: timeConsumedWidth,
        resizable: true,
        cellClass: 'column-prop_total_time',
        headerCellClass: 'cursor-default',
        renderHeaderCell: () => (
          <div className="flex items-center text-xs w-full">
            <p className="!text-foreground font-medium">Time consumed</p>
          </div>
        ),
        renderCell: (props) => {
          const row = props.row as ClassifiedQuery
          const percentage = row.prop_total_time || 0
          const totalTime = row.total_time || 0
          const fillWidth = Math.min(percentage, 100)
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              <div
                className="absolute inset-0 bg-foreground transition-all duration-200 z-0"
                style={{ width: `${fillWidth}%`, opacity: 0.04 }}
              />
              {percentage && totalTime ? (
                <span className="flex items-center justify-end gap-x-1.5">
                  <span
                    className={cn(percentage.toFixed(1) === '0.0' && 'text-foreground-lighter')}
                  >
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-muted">/</span>
                  <span
                    className={cn(formatDuration(totalTime) === '0ms' && 'text-foreground-lighter')}
                  >
                    {formatDuration(totalTime)}
                  </span>
                </span>
              ) : (
                <p className="text-muted">&ndash;</p>
              )}
            </div>
          )
        },
      },
      {
        key: 'calls',
        name: 'Calls',
        minWidth: 100,
        resizable: true,
        headerCellClass: 'cursor-default',
        renderHeaderCell: () => (
          <div className="flex items-center text-xs w-full">
            <p className="!text-foreground font-medium">Calls</p>
          </div>
        ),
        renderCell: (props) => {
          const value = (props.row as ClassifiedQuery).calls
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
        },
      },
      {
        key: 'actions',
        name: 'Actions',
        minWidth: 300,
        resizable: false,
        headerCellClass: 'cursor-default',
        renderHeaderCell: () => (
          <div className="flex items-center text-xs w-full">
            <p className="!text-foreground font-medium">Actions</p>
          </div>
        ),
        renderCell: (props) => {
          const row = props.row as ClassifiedQuery
          return (
            <div className="flex items-center gap-2 justify-end w-full h-full">
              <Button
                type="default"
                size="tiny"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  handleGoToLogs()
                }}
              >
                Go to Logs
              </Button>
              {(row.issueType === 'index' || row.issueType === 'slow') && (
                <Button
                  type="default"
                  size="tiny"
                  icon={
                    explainLoadingQuery === row.query ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : undefined
                  }
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    setSelectedTriageRow(props.rowIdx)
                    setSheetView('explain')
                  }}
                >
                  Explain
                </Button>
              )}
              {row.issueType === 'index' && (
                <Button
                  type="primary"
                  size="tiny"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    setSelectedTriageRow(props.rowIdx)
                    setSheetView('indexes')
                  }}
                >
                  Create Index
                </Button>
              )}
              {(row.issueType === 'error' || row.issueType === 'slow') && (
                <Button
                  type="default"
                  size="tiny"
                  icon={<AiIconAnimation size={14} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation()
                    handleAiSuggestedFix(row)
                  }}
                >
                  Fix with AI
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [
      triageQueryColWidth,
      timeConsumedWidth,
      explainLoadingQuery,
      handleGoToLogs,
      handleAiSuggestedFix,
    ]
  )

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
            <ButtonTooltip
              tooltip={{
                content: {
                  text: showIntrospection ? 'Hide system queries' : 'Show system queries',
                },
              }}
              type={showIntrospection ? 'default' : 'outline'}
              size="tiny"
              className={cn(
                'w-[26px] h-[26px] !p-0',
                showIntrospection ? 'bg-surface-300' : 'border-dashed'
              )}
              icon={showIntrospection ? <Eye size={14} /> : <EyeOff size={14} />}
              onClick={onToggleIntrospection}
            />
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

      <div ref={scrollContainerRef} className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
