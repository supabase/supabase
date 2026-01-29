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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 30,
            mass: 0.4,
          }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 transform-gpu will-change-transform"
        >
          <div className="flex items-center gap-8 pl-4 pr-2 py-2 bg-surface-100 border rounded-lg shadow-lg">
            <span className="text-xs text-foreground-light max-w-40 truncate">
              {operationCount} pending change{operationCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button type="default" size="tiny" onClick={() => snap.onViewOperationQueue()}>
                Review <span className="text-foreground/40 ml-1">{`${modKey}.`}</span>
              </Button>
              <Button
                size="tiny"
                type="primary"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                Save{operationCount > 1 && ' all'}
                <span className="text-foreground/40 ml-1">{`${modKey}S`}</span>
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
