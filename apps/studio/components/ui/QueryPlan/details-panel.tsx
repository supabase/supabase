import { useState } from 'react'
import { Check } from 'lucide-react'

import { Button } from '@ui/components/shadcn/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, copyToClipboard } from 'ui'
import type { PlanNodeData } from './types'

export const DetailsPanel = ({
  selectedNode,
  setSelectedNode,
  portalContainer,
  isFullscreen,
}: {
  selectedNode: PlanNodeData
  setSelectedNode: (node: PlanNodeData | null) => void
  portalContainer?: HTMLElement | null
  isFullscreen?: boolean
}) => {
  const [copiedConditions, setCopiedConditions] = useState(false)
  const [copiedOutputCols, setCopiedOutputCols] = useState(false)
  const [copiedRawJson, setCopiedRawJson] = useState(false)

  return (
    <Drawer
      open={Boolean(selectedNode)}
      onOpenChange={(open) => {
        if (!open) setSelectedNode(null)
      }}
      direction="right"
    >
      <DrawerContent
        container={portalContainer}
        overlayClassName={isFullscreen ? 'pointer-events-none' : undefined}
        className={
          isFullscreen
            ? 'data-[vaul-drawer-direction=right]:sm:max-w-[560px] data-[vaul-drawer-direction=right]:md:max-w-[720px] data-[vaul-drawer-direction=right]:lg:max-w-[860px]'
            : 'data-[vaul-drawer-direction=right]:w-full'
        }
      >
        <DrawerHeader className="border-b p-3 sticky top-0 bg-background z-10">
          <DrawerTitle className="text-sm font-semibold truncate" title={selectedNode.label}>
            Details: {selectedNode.label}
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="absolute right-3 top-2 h-6 px-2 py-1">
              Close
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div
          className="px-4 py-3 space-y-4 overflow-y-auto text-xs w-full"
          style={{ maxHeight: 'calc(100dvh - 56px)' }}
        >
          {/* Context line */}
          {(selectedNode.relationName || selectedNode.alias) && (
            <div className="text-foreground-lighter">
              {selectedNode.relationName ?? ''}
              {selectedNode.alias ? ` as ${selectedNode.alias}` : ''}
            </div>
          )}

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Conditions</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-0.5 text-xs"
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
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Output Columns</div>
              {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-0.5 text-xs"
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
              <div className="p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words font-mono">
                {selectedNode.outputCols.join(', ')}
              </div>
            ) : (
              <div className="text-foreground-lighter">(none)</div>
            )}
          </div>

          {/* Raw JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Raw JSON</div>
              {selectedNode.raw && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-0.5 text-xs"
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
              <pre className="p-3 border rounded bg-surface-100 overflow-auto text-[11px] font-mono max-h-[60vh]">
                {JSON.stringify(selectedNode.raw, null, 2)}
              </pre>
            ) : (
              <div className="text-foreground-lighter">(no data)</div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
