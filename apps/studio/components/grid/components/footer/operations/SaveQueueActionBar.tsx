import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'
import { useOperationQueueShortcuts } from 'components/grid/hooks/useOperationQueueShortcuts'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button } from 'ui'

import { getModKeyLabel } from '@/lib/helpers'

export const SaveQueueActionBar = () => {
  const modKey = getModKeyLabel()
  const snap = useTableEditorStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const { handleSave } = useOperationQueueActions()

  useOperationQueueShortcuts()

  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'
  const isOperationQueuePanelOpen = snap.sidePanel?.type === 'operation-queue'

  const isVisible =
    isQueueOperationsEnabled && snap.hasPendingOperations && !isOperationQueuePanelOpen

  const content = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-8 px-4 py-3 bg-surface-100 border rounded-lg shadow-lg">
            <span className="text-sm text-foreground">
              {operationCount} pending change{operationCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => snap.toggleViewOperationQueue()}
                className="text-foreground-light hover:text-foreground transition-colors flex items-center"
                aria-label="View Details"
              >
                <Eye size={14} />
                <span className="text-foreground-lighter text-[10px] ml-1">{`${modKey}.`}</span>
              </button>
              <Button
                size="tiny"
                type="primary"
                onClick={handleSave}
                disabled={isSaving}
                loading={isSaving}
              >
                Save
                <span className="text-foreground-lighter text-[10px] ml-1">{`${modKey}S`}</span>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined' || !document.body) return null
  return createPortal(content, document.body)
}
