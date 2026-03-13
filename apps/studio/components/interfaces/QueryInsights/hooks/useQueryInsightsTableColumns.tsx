import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, ExternalLink, ScanSearch } from 'lucide-react'
import { type RefObject, useMemo } from 'react'
// eslint-disable-next-line no-restricted-imports
import { type Column, type DataGridHandle } from 'react-data-grid'
import {
  Button,
  cn,
  CodeBlock,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { buildQueryInsightFixPrompt } from '../../QueryPerformance/QueryPerformance.ai'
import { QUERY_PERFORMANCE_ROLE_DESCRIPTION } from '../../QueryPerformance/QueryPerformance.constants'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import {
  ISSUE_DOT_COLORS,
  ISSUE_ICONS,
  NON_SORTABLE_COLUMNS,
  QUERY_INSIGHTS_EXPLORER_COLUMNS,
} from '../QueryInsightsTable/QueryInsightsTable.constants'
import {
  formatDuration,
  getColumnName,
  getTableName,
} from '../QueryInsightsTable/QueryInsightsTable.utils'

interface UseQueryInsightsTableColumnsParams {
  sort: { column: string; order: 'asc' | 'desc' }
  setSort: (config: { column: string; order: 'asc' | 'desc' } | null) => void
  timeConsumedWidth: number
  triageQueryColWidth: number
  gridRef: RefObject<DataGridHandle | null>
  setSelectedRow: (idx: number) => void
  setSelectedTriageRow: (idx: number | undefined) => void
  setSheetView: (view: 'details' | 'indexes' | 'explain') => void
  handleGoToLogs: () => void
  handleAiSuggestedFix: (item: ClassifiedQuery) => void
}

export function useQueryInsightsTableColumns({
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
}: UseQueryInsightsTableColumnsParams): {
  columns: Column<ClassifiedQuery>[]
  triageColumns: Column<ClassifiedQuery>[]
} {
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
  }, [sort, setSort, timeConsumedWidth, gridRef, setSelectedRow, setSheetView])

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
        minWidth: 90,
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
        key: 'mean_time',
        name: 'Mean time',
        minWidth: 90,
        resizable: true,
        headerCellClass: 'cursor-default',
        renderHeaderCell: () => (
          <div className="flex items-center text-xs w-full">
            <p className="!text-foreground font-medium">Mean time</p>
          </div>
        ),
        renderCell: (props) => {
          const value = (props.row as ClassifiedQuery).mean_time
          return (
            <div className="w-full flex flex-col justify-center text-xs text-right tabular-nums font-mono">
              {typeof value === 'number' && !isNaN(value) && isFinite(value) ? (
                <p className={cn(value === 0 && 'text-foreground-lighter')}>
                  {formatDuration(value)}
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
        minWidth: 200,
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
              {!row.issueType && (
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
              )}
              {row.issueType === 'index' && (
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="primary"
                    size="tiny"
                    className="rounded-r-none border-r-0"
                    onClick={() => {
                      setSelectedTriageRow(props.rowIdx)
                      setSheetView('indexes')
                    }}
                  >
                    Create Index
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="primary"
                        size="tiny"
                        className="rounded-l-none px-1"
                        icon={<ChevronDown size={12} />}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleGoToLogs()} className="gap-2">
                        <ExternalLink size={14} />
                        Go to Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTriageRow(props.rowIdx)
                          setSheetView('explain')
                        }}
                        className="gap-2"
                      >
                        <ScanSearch size={14} />
                        Explain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {(row.issueType === 'error' || row.issueType === 'slow') && (
                <div onClick={(e) => e.stopPropagation()}>
                  <AiAssistantDropdown
                    label="Fix with AI"
                    buildPrompt={() => buildQueryInsightFixPrompt(row).prompt}
                    onOpenAssistant={() => handleAiSuggestedFix(row)}
                    copyLabel="Copy Markdown"
                    extraDropdownItems={
                      <>
                        <DropdownMenuItem onClick={() => handleGoToLogs()} className="gap-2">
                          <ExternalLink size={14} />
                          Go to Logs
                        </DropdownMenuItem>
                        {row.issueType === 'slow' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTriageRow(props.rowIdx)
                              setSheetView('explain')
                            }}
                            className="gap-2"
                          >
                            <ScanSearch size={14} />
                            Explain
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                      </>
                    }
                  />
                </div>
              )}
            </div>
          )
        },
      },
    ],
    [
      triageQueryColWidth,
      timeConsumedWidth,
      handleGoToLogs,
      handleAiSuggestedFix,
      setSelectedTriageRow,
      setSheetView,
    ]
  )

  return { columns, triageColumns }
}
