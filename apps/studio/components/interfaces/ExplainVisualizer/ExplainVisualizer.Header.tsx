import { Activity, ArrowUp, Clock, Database, GitMerge, Hash, Zap } from 'lucide-react'
import { Badge } from 'ui'

export interface ExplainSummary {
  totalTime: number
  hasSeqScan: boolean
  hasIndexScan: boolean
}

export interface ExplainHeaderProps {
  mode: 'visual' | 'raw'
  onToggleMode: () => void
  summary?: ExplainSummary
}

export function ExplainHeader({ mode, onToggleMode, summary }: ExplainHeaderProps) {
  const isVisual = mode === 'visual'

  const hasSummaryStats =
    isVisual && summary && (summary.totalTime > 0 || (summary.hasSeqScan && !summary.hasIndexScan))

  return (
    <div className="bg-surface-100 border-b px-4 py-3 flex flex-col gap-3 text-xs">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-foreground-light" />
        <h3 className="text-sm font-medium text-foreground">Query Execution Plan</h3>
        <button
          type="button"
          onClick={onToggleMode}
          className="font-mono text-xs text-foreground-lighter hover:text-foreground transition-colors"
          aria-label={isVisual ? 'Switch to raw explain output' : 'Switch to visual explain output'}
        >
          {isVisual ? '[VISUAL]' : '[RAW]'}
        </button>
      </div>

      {/* How to read */}
      <div className="flex items-center gap-2 text-foreground-lighter">
        <ArrowUp size={12} className="text-foreground-light" />
        <span className="font-medium text-foreground-light">How to read:</span>
        <span>
          Start at the bottom where data is read from tables, then follow upward as each step
          processes the results.
        </span>
      </div>

      {/* Summary stats - only show in visual mode when we have the data */}
      {hasSummaryStats && (
        <div className="flex items-center gap-4 flex-wrap">
          {summary.totalTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-foreground-muted" />
              <span className="text-foreground-light">Total:</span>
              <span className="font-mono font-medium text-foreground">
                {summary.totalTime.toFixed(2)}ms
              </span>
            </div>
          )}
          {summary.hasSeqScan && !summary.hasIndexScan && (
            <Badge variant="warning" className="text-xs gap-1">
              <Database size={10} />
              Sequential scan detected
            </Badge>
          )}
        </div>
      )}

      {/* Icon legend - only relevant in visual mode */}
      {isVisual && (
        <div className="flex items-center gap-4 flex-wrap text-foreground-lighter">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-warning" />
            <span>Seq Scan (full table read)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-brand" />
            <span>Index Scan (fast lookup)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitMerge size={12} className="text-foreground-light" />
            <span>Join</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-foreground-light" />
            <span>Hash (lookup table)</span>
          </div>
        </div>
      )}
    </div>
  )
}
