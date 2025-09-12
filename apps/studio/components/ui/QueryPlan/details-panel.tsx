import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Check } from 'lucide-react'

import { cn, copyToClipboard, Button_Shadcn_ as Button } from 'ui'
import type { PlanNodeData } from './types'

// Load SqlMonacoBlock (monaco editor) client-side only (does not behave well server-side)
const JsonMonacoBlock = dynamic(
  () => import('./json-monaco-block').then(({ JsonMonacoBlock }) => JsonMonacoBlock),
  { ssr: false }
)

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
  const [copiedOutputCols, setCopiedOutputCols] = useState(false)
  const [copiedRawJson, setCopiedRawJson] = useState(false)
  const [jsonHeight, setJsonHeight] = useState<number>(isFullscreen ? 420 : 220)

  useEffect(() => {
    const calc = () => {
      if (typeof window === 'undefined') return
      if (isFullscreen) {
        const h = Math.floor(window.innerHeight * 0.6)
        setJsonHeight(Math.max(320, Math.min(720, h)))
      } else {
        setJsonHeight(220)
      }
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [isFullscreen])

  return (
    <div
      className={cn(
        // Full height always; if not fullscreen, also take the full width for easier reading
        // Else behave like a right-side drawer
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
          variant="outline"
          size="sm"
          className="text-xs h-6 px-2 py-1"
          onClick={() => setSelectedNode(null)}
        >
          Close
        </Button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto text-[11px] flex-1">
        {/* Context line */}
        {(selectedNode.relationName || selectedNode.alias) && (
          <div className="text-foreground-lighter">
            {selectedNode.relationName ?? ''}
            {selectedNode.alias ? ` as ${selectedNode.alias}` : ''}
          </div>
        )}

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">Conditions</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 py-0.5 text-[11px]"
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
                {copiedConditions ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Copied
                  </span>
                ) : (
                  'Copy'
                )}
              </Button>
            </div>
          </div>
          <ul className="space-y-1">
            {selectedNode.hashCond && (
              <li>
                <span className="text-foreground-lighter">Hash Cond:</span> {selectedNode.hashCond}
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
            {!(
              selectedNode.hashCond ||
              selectedNode.mergeCond ||
              selectedNode.joinFilter ||
              selectedNode.indexCond ||
              selectedNode.recheckCond ||
              selectedNode.filter
            ) && <li className="text-foreground-lighter">(none)</li>}
          </ul>
        </div>

        {/* Output columns */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">Output Columns</div>
            {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 py-0.5 text-[11px]"
                onClick={() =>
                  copyToClipboard(selectedNode.outputCols!.join(', '), () => {
                    setCopiedOutputCols(true)
                    setTimeout(() => setCopiedOutputCols(false), 1200)
                  })
                }
              >
                {copiedOutputCols ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Copied
                  </span>
                ) : (
                  'Copy'
                )}
              </Button>
            )}
          </div>
          {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 ? (
            <div className="p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
              {selectedNode.outputCols.join(', ')}
            </div>
          ) : (
            <div className="text-foreground-lighter">(none)</div>
          )}
        </div>

        {/* Raw JSON */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold">Raw JSON</div>
            {selectedNode.raw && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 py-0.5 text-[11px]"
                onClick={() =>
                  copyToClipboard(JSON.stringify(selectedNode.raw, null, 2), () => {
                    setCopiedRawJson(true)
                    setTimeout(() => setCopiedRawJson(false), 1200)
                  })
                }
              >
                {copiedRawJson ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Copied
                  </span>
                ) : (
                  'Copy'
                )}
              </Button>
            )}
          </div>
          {selectedNode.raw ? (
            <JsonMonacoBlock
              value={JSON.stringify(selectedNode.raw, null, 2)}
              height={jsonHeight}
              lineNumbers="off"
              wrapperClassName="bg-surface-100"
            />
          ) : (
            <div className="text-foreground-lighter">(no data)</div>
          )}
        </div>
      </div>
    </div>
  )
}
