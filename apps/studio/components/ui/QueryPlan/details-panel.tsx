import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Check, Copy } from 'lucide-react'

import type { PlanNodeData } from './types'
import { cn, copyToClipboard, Button } from 'ui'

/**
 * Load SqlMonacoBlock (monaco editor) client-side only (does not behave well server-side)
 * @see: apps/studio/components/interfaces/SQLEditor/SQLEditor.tsx
 */
const JsonMonacoBlock = dynamic(
  () => import('./json-monaco-block').then(({ JsonMonacoBlock }) => JsonMonacoBlock),
  { ssr: false }
)

const NoData = () => {
  return <div className="text-foreground-lighter">(none)</div>
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
  const [copiedConditions, setCopiedConditions] = useState(false)
  const [copiedRelation, setCopiedRelation] = useState(false)
  const [copiedOutputCols, setCopiedOutputCols] = useState(false)

  const hasNoConditions =
    !selectedNode.hashCond &&
    !selectedNode.mergeCond &&
    !selectedNode.joinFilter &&
    !selectedNode.indexCond &&
    !selectedNode.recheckCond &&
    !selectedNode.filter

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

              <Button
                type="outline"
                size="tiny"
                icon={copiedRelation ? <Check /> : <Copy />}
                className="px-1.5 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() =>
                  copyToClipboard(
                    `${selectedNode.relationName ?? ''}${selectedNode.alias ? ` as ${selectedNode.alias}` : ''}`,
                    () => {
                      setCopiedRelation(true)
                      setTimeout(() => setCopiedRelation(false), 1200)
                    }
                  )
                }
              >
                {copiedRelation ? 'Copied' : null}
              </Button>
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

              <Button
                type="outline"
                size="tiny"
                icon={copiedConditions ? <Check /> : <Copy />}
                className="px-1.5 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  const parts = [
                    selectedNode.hashCond && `Hash Cond: ${selectedNode.hashCond}`,
                    selectedNode.mergeCond && `Merge Cond: ${selectedNode.mergeCond}`,
                    selectedNode.joinFilter && `Join Filter: ${selectedNode.joinFilter}`,
                    selectedNode.indexCond && `Index Cond: ${selectedNode.indexCond}`,
                    selectedNode.recheckCond && `Recheck Cond: ${selectedNode.recheckCond}`,
                    selectedNode.filter && `Filter: ${selectedNode.filter}`,
                  ].filter(Boolean)
                  copyToClipboard(parts.join('\n'), () => {
                    setCopiedConditions(true)
                    setTimeout(() => setCopiedConditions(false), 1200)
                  })
                }}
              >
                {copiedConditions ? 'Copied' : null}
              </Button>
            </div>
          )}
        </div>

        {/* Output columns */}
        <div>
          <div className="font-semibold mb-1">Output Columns</div>
          {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 ? (
            <div className="relative group p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
              <span>{selectedNode.outputCols.join(', ')}</span>

              <Button
                type="outline"
                size="tiny"
                icon={copiedOutputCols ? <Check /> : <Copy />}
                className="px-1.5 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() =>
                  copyToClipboard(selectedNode.outputCols!.join(', '), () => {
                    setCopiedOutputCols(true)
                    setTimeout(() => setCopiedOutputCols(false), 1200)
                  })
                }
              >
                {copiedOutputCols ? 'Copied' : null}
              </Button>
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
