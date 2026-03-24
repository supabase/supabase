import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import CopyButton from 'components/ui/CopyButton'
import { ExplainVisualizer } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer'
import { ExplainHeader } from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.Header'
import {
  isExplainQuery,
  isTextFormatExplain,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.utils'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import Results from './Results'

export type UtilityTabExplainProps = {
  id: string
  isExecuting?: boolean
}

export function UtilityTabExplain({ id, isExecuting }: UtilityTabExplainProps) {
  const snapV2 = useSqlEditorV2StateSnapshot()
  const explainResult = snapV2.explainResults[id]
  const [mode, setMode] = useState<'visual' | 'raw'>('visual')

  if (isExecuting) {
    return (
      <div className="flex items-center gap-x-4 px-6 py-4 bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <Loader2 size={14} className="animate-spin" />
        <p className="m-0 border-0 font-mono text-sm">Running EXPLAIN ANALYZE...</p>
      </div>
    )
  }

  if (explainResult?.error) {
    const formattedError = (explainResult.error?.formattedError?.split('\n') ?? []).filter(
      (x: string) => x.length > 0
    )

    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
        <div className="flex flex-row justify-between items-start py-4 px-6 gap-x-4 pb-9">
          <div className="flex flex-col gap-y-1">
            {formattedError.length > 0 ? (
              formattedError.map((x: string, i: number) => (
                <pre key={`error-${i}`} className="font-mono text-sm text-wrap">
                  {x}
                </pre>
              ))
            ) : (
              <p className="font-mono text-sm tracking-tight">
                Error: {explainResult.error?.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-x-2">
            {formattedError.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <CopyButton iconOnly type="default" text={formattedError.join('\n')} />
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center">
                  <span>Copy error</span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!explainResult || explainResult.rows.length === 0) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
        <p className="m-0 border-0 px-4 py-4 text-sm text-foreground-light">
          No execution plan available. The query will be analyzed when you switch to this tab.
        </p>
      </div>
    )
  }

  const isValidExplain = isExplainQuery(explainResult.rows)
  const isTextFormat = isTextFormatExplain(explainResult.rows)

  if (!isValidExplain) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark overflow-y-auto">
        <p className="m-0 border-0 px-4 py-4 text-sm text-foreground-light">
          Unable to parse explain results. Please try running the query again.
        </p>
      </div>
    )
  }

  // Handle non-TEXT formats (JSON, YAML, XML) - show raw output only
  if (!isTextFormat) {
    return (
      <div className="h-full flex flex-col pb-9">
        <div className="px-4 py-3 bg-surface-100 border-b border-default flex items-center gap-2">
          <span className="text-sm text-foreground-light">
            Visual execution plan is only available for TEXT format. Showing raw output.
          </span>
        </div>
        <Results rows={explainResult.rows} />
      </div>
    )
  }

  const toggleMode = () => setMode(mode === 'visual' ? 'raw' : 'visual')

  return (
    <div className="h-full flex flex-col pb-9">
      {mode === 'visual' ? (
        <ExplainVisualizer rows={explainResult.rows} onShowRaw={toggleMode} id={id} />
      ) : (
        <>
          <ExplainHeader mode="raw" onToggleMode={toggleMode} id={id} rows={explainResult.rows} />
          <Results rows={explainResult.rows} />
        </>
      )}
    </div>
  )
}
