import { Loader2 } from 'lucide-react'
import { AiIconAnimation, Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import type { ClassifiedQuery } from '../QueryInsightsHealth/QueryInsightsHealth.types'
import { ISSUE_DOT_COLORS, ISSUE_ICONS } from './QueryInsightsTable.constants'
import { formatDuration, getTableName, getColumnName } from './QueryInsightsTable.utils'

interface QueryInsightsTableRowProps {
  item: ClassifiedQuery
  onRowClick?: () => void
  onGoToLogs?: () => void
  onCreateIndex?: () => void
  onExplain?: () => void
  onAiSuggestedFix?: () => void
  isExplainLoading?: boolean
}

export const QueryInsightsTableRow = ({
  item,
  onRowClick,
  onGoToLogs,
  onCreateIndex,
  onExplain,
  onAiSuggestedFix,
  isExplainLoading,
}: QueryInsightsTableRowProps) => {
  const IssueIcon = item.issueType ? ISSUE_ICONS[item.issueType] : null

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 border-b hover:bg-surface-100 cursor-pointer group"
      onClick={onRowClick}
    >
      {item.issueType && IssueIcon && (
        <div
          className={cn(
            'h-6 w-6 rounded-full flex-shrink-0 border flex items-center justify-center',
            ISSUE_DOT_COLORS[item.issueType]?.border,
            ISSUE_DOT_COLORS[item.issueType]?.background
          )}
        >
          <IssueIcon size={14} className={ISSUE_DOT_COLORS[item.issueType].color} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-foreground line-clamp-1">
          <span className="text-foreground">{item.queryType ?? '–'}</span>
          {getTableName(item.query) && (
            <>
              {' '}
              <span className="text-foreground-lighter">in</span> {getTableName(item.query)}
            </>
          )}
          {getColumnName(item.query) && (
            <>
              <span className="text-foreground-lighter">,</span> {getColumnName(item.query)}
            </>
          )}
        </p>
        <p
          className={cn(
            'text-xs mt-0.5 font-mono line-clamp-1',
            item.issueType === 'error' && 'text-destructive-600',
            item.issueType === 'index' && 'text-warning-600',
            item.issueType === 'slow' && 'text-foreground-lighter'
          )}
        >
          {item.hint}
        </p>
      </div>

      <div className="flex items-stretch divide-x divide-border flex-shrink-0 tabular-nums">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-end pr-4 cursor-default">
              <span
                className={cn(
                  'text-sm font-mono leading-snug',
                  item.mean_time >= 1000 && 'text-destructive-600'
                )}
              >
                {formatDuration(item.mean_time)}
              </span>
              <span className="text-[10px] text-foreground-muted uppercase tracking-wide leading-snug">
                avg
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-center">
            Average execution time per call. High mean time means individual runs are slow —
            directly felt by users.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-end px-4 cursor-default">
              <span className="text-sm font-mono leading-snug">
                {item.prop_total_time.toFixed(1)}%
              </span>
              <span className="text-[10px] text-foreground-muted uppercase tracking-wide leading-snug">
                of db
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-center">
            Percentage of total database execution time. Fixing high-impact queries has the biggest
            overall effect on your database.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-end pl-4 cursor-default">
              <span className="text-sm font-mono leading-snug">{item.calls.toLocaleString()}</span>
              <span className="text-[10px] text-foreground-muted uppercase tracking-wide leading-snug">
                calls
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[220px] text-center">
            Number of times this query ran in the selected time window.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 justify-end w-[260px]">
        <Button
          type="default"
          size="tiny"
          onClick={(e) => {
            e.stopPropagation()
            onGoToLogs?.()
          }}
        >
          Go to Logs
        </Button>

        {(item.issueType === 'index' || item.issueType === 'slow') && (
          <Button
            type="default"
            size="tiny"
            icon={isExplainLoading ? <Loader2 size={12} className="animate-spin" /> : undefined}
            onClick={(e) => {
              e.stopPropagation()
              onExplain?.()
            }}
          >
            Explain
          </Button>
        )}

        {item.issueType === 'index' && (
          <Button
            type="primary"
            size="tiny"
            onClick={(e) => {
              e.stopPropagation()
              onCreateIndex?.()
            }}
          >
            Create Index
          </Button>
        )}

        {(item.issueType === 'error' || item.issueType === 'slow') && (
          <Button
            type="default"
            size="tiny"
            icon={<AiIconAnimation size={14} />}
            onClick={(e) => {
              e.stopPropagation()
              onAiSuggestedFix?.()
            }}
          >
            Fix with AI
          </Button>
        )}
      </div>
    </div>
  )
}
