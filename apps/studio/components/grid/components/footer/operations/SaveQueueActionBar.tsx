import { Eye } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Button } from 'ui'

import {
  useOperationQueueShortcuts,
  getModKey,
} from 'components/grid/hooks/useOperationQueueShortcuts'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'

export const SaveQueueActionBar = () => {
  const snap = useTableEditorStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const { handleSave } = useOperationQueueActions()

  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'
  const isOperationQueuePanelOpen = snap.sidePanel?.type === 'operation-queue'

  const isVisible =
    isQueueOperationsEnabled && snap.hasPendingOperations && !isOperationQueuePanelOpen

  useOperationQueueShortcuts({
    enabled: isQueueOperationsEnabled && snap.hasPendingOperations,
    onSave: handleSave,
    onTogglePanel: () => snap.onViewOperationQueue(),
    isSaving,
    hasOperations: operationCount > 0,
  })

  const modKey = getModKey()

  const content = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-8 pl-4 pr-2 py-2 bg-surface-100 border rounded-lg shadow-lg">
            <span className="text-xs text-foreground-light">
              {operationCount} pending change{operationCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button type="default" size="tiny" aria-label="View details" onClick={() => snap.onViewOperationQueue()}>Review <span className="text-foreground/40 text-[10px] ml-1">{`${modKey}.`}</span></Button>
              <Button
                size="tiny"
                type="primary"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                Save{operationCount > 1 && ' all'}
                <span className="text-foreground/40 text-[10px] ml-1">{`${modKey}S`}</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
