import dynamic from 'next/dynamic'

import type { PlanNodeData } from './types'
import { formatMs, formatNumber } from './utils/formats'
import { cn, Button } from 'ui'

/**
 * Load SqlMonacoBlock (monaco editor) client-side only (does not behave well server-side)
 * @see: apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx
 */
const JsonMonacoBlock = dynamic(
  () => import('./json-monaco-block').then(({ JsonMonacoBlock }) => JsonMonacoBlock),
  { ssr: false }
)

const NoData = () => {
  return <div className="text-foreground-lighter">none</div>
}

export const DetailsPanel = ({
  selectedNode,
  setSelectedNode,
  isFullscreen = false,
}: {
  selectedNode: PlanNodeData
  setSelectedNode: (node: PlanNodeData | null) => void
  isFullscreen?: boolean
}) => {
  const hasNoConditions =
    !selectedNode.hashCond &&
    !selectedNode.mergeCond &&
    !selectedNode.joinFilter &&
    !selectedNode.indexCond &&
    !selectedNode.recheckCond &&
    !selectedNode.filter

  const hasTimingMetrics =
    selectedNode.actualStartupTime !== undefined ||
    selectedNode.actualTotalTime !== undefined ||
    selectedNode.exclusiveTimeMs !== undefined ||
    selectedNode.actualLoops !== undefined

  const totalTimeAllLoops =
    selectedNode.actualTotalTime !== undefined
      ? selectedNode.actualTotalTime * (selectedNode.actualLoops ?? 1)
      : undefined

  return (
    <div
      className={cn(
        // Position panel based on fullscreen mode:
        // - Fullscreen: right-side drawer
        // - Normal: full overlay for better readability
        'absolute z-20 border bg-background shadow-xl flex flex-col rounded-md',
        isFullscreen
          ? 'inset-y-0 right-0 w-[420px] sm:w-[440px] md:w-[480px] max-w-[85%] border-y-0 border-r-0 rounded-l-none'
          : 'inset-0 w-full'
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-xs font-semibold truncate" title={selectedNode.label}>
          Details: {selectedNode.label}
        </div>
        <Button
          type="outline"
          size="tiny"
          className="text-xs h-6 px-2 py-1"
          onClick={() => setSelectedNode(null)}
        >
          Close
        </Button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto text-[11px] flex-1">
        {/* Timing */}
        <div>
          <div className="font-semibold mb-1">Timing</div>
          {hasTimingMetrics ? (
            <div className="p-2 border rounded bg-surface-100 space-y-1">
              {selectedNode.actualTotalTime !== undefined && (
                <div className="flex items-center justify-between gap-x-2">
                  <span className="text-foreground-lighter">Total time</span>
                  <span>
                    {formatMs(selectedNode.actualTotalTime)} ms
                    {selectedNode.actualLoops && selectedNode.actualLoops > 1
                      ? ` ×${formatNumber(selectedNode.actualLoops)}`
                      : ''}
                  </span>
                </div>
              )}
              {totalTimeAllLoops !== undefined &&
                selectedNode.actualLoops !== undefined &&
                selectedNode.actualLoops > 1 && (
                  <div className="flex items-center justify-between gap-x-2">
                    <span className="text-foreground-lighter">Total time (all loops)</span>
                    <span>{formatMs(totalTimeAllLoops)} ms</span>
                  </div>
                )}
              {selectedNode.exclusiveTimeMs !== undefined && (
                <div className="flex items-center justify-between gap-x-2">
                  <span className="text-foreground-lighter">Self time</span>
                  <span>{formatMs(selectedNode.exclusiveTimeMs)} ms</span>
                </div>
              )}
              {selectedNode.actualStartupTime !== undefined && (
                <div className="flex items-center justify-between gap-x-2">
                  <span className="text-foreground-lighter">Startup time</span>
                  <span>{formatMs(selectedNode.actualStartupTime)} ms</span>
                </div>
              )}
              {selectedNode.actualLoops !== undefined && (
                <div className="flex items-center justify-between gap-x-2">
                  <span className="text-foreground-lighter">Loops</span>
                  <span>{formatNumber(selectedNode.actualLoops)}</span>
                </div>
              )}
            </div>
          ) : (
            <NoData />
          )}
        </div>

        {/* Relation */}
        <div>
          <div className="font-semibold mb-1">Relation</div>
          {selectedNode.relationName || selectedNode.alias ? (
            <div className="relative group p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
              <span>
                {selectedNode.relationName ?? ''}
                {selectedNode.alias && (
                  <>
                    {' '}
                    <span className="text-foreground-lighter">as</span> {selectedNode.alias}
                  </>
                )}
              </span>
            </div>
          ) : (
            <NoData />
          )}
        </div>

        {/* Conditions */}
        <div>
          <div className="font-semibold mb-1">Conditions</div>
          {hasNoConditions ? (
            <NoData />
          ) : (
            <div className="relative group">
              <ul className="p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
                {selectedNode.hashCond && (
                  <li>
                    <span className="text-foreground-lighter">Hash Cond:</span>{' '}
                    {selectedNode.hashCond}
                  </li>
                )}
                {selectedNode.mergeCond && (
                  <li>
                    <span className="text-foreground-lighter">Merge Cond:</span>{' '}
                    {selectedNode.mergeCond}
                  </li>
                )}
                {selectedNode.joinFilter && (
                  <li>
                    <span className="text-foreground-lighter">Join Filter:</span>{' '}
                    {selectedNode.joinFilter}
                  </li>
                )}
                {selectedNode.indexCond && (
                  <li>
                    <span className="text-foreground-lighter">Index Cond:</span>{' '}
                    {selectedNode.indexCond}
                  </li>
                )}
                {selectedNode.recheckCond && (
                  <li>
                    <span className="text-foreground-lighter">Recheck Cond:</span>{' '}
                    {selectedNode.recheckCond}
                  </li>
                )}
                {selectedNode.filter && (
                  <li>
                    <span className="text-foreground-lighter">Filter:</span> {selectedNode.filter}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Output columns */}
        <div>
          <div className="font-semibold mb-1">Output Columns</div>
          {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 ? (
            <div className="relative group p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
              <span>{selectedNode.outputCols.join(', ')}</span>
            </div>
          ) : (
            <NoData />
          )}
        </div>

        {/* Raw JSON */}
        <div>
          <div className="font-semibold mb-1">Raw JSON</div>
          {selectedNode.raw ? (
            <JsonMonacoBlock
              value={JSON.stringify(selectedNode.raw, null, 2)}
              height={isFullscreen ? 420 : 220}
              lineNumbers="off"
              wrapperClassName="bg-surface-100"
            />
          ) : (
            <NoData />
          )}
        </div>
      </div>
    </div>
  )
}
