import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'
import { useOperationQueueShortcuts } from 'components/grid/hooks/useOperationQueueShortcuts'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button } from 'ui'

import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { getModKeyLabel } from '@/lib/helpers'

export const SaveQueueActionBar = () => {
  const modKey = getModKeyLabel()
  const snap = useTableEditorStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const { handleSave, handleCancel } = useOperationQueueActions()

  useOperationQueueShortcuts()

  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'
  const isOperationQueuePanelOpen = snap.sidePanel?.type === 'operation-queue'

  const isVisible =
    isQueueOperationsEnabled && snap.hasPendingOperations && !isOperationQueuePanelOpen

  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => true,
    onClose: () => handleCancel(),
  })

  const content = (
    <>
      <AnimatePresence>
        {isVisible && (
          <div className="fixed bottom-12 z-50 left-1/2 -translate-x-1/2">
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
            >
              <div className="flex items-center gap-x-12 pl-4 pr-2 py-2 bg-surface-100 border rounded-lg shadow-lg">
                <div className="flex items-center gap-x-2">
                  <span className="text-xs text-foreground-light max-w-40 truncate">
                    {operationCount} pending change{operationCount !== 1 ? 's' : ''}
                  </span>
                  <Button
                    type="default"
                    size="tiny"
                    disabled={isSaving}
                    onClick={() => snap.toggleViewOperationQueue()}
                  >
                    Review{' '}
                    <span className="text-[10px] text-foreground/40 ml-1.5">{`${modKey}.`}</span>
                  </Button>
                </div>
                <div className="flex items-center gap-x-2">
                  <Button type="default" onClick={confirmOnClose} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    size="tiny"
                    type="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    loading={isSaving}
                  >
                    Save
                    <span className="text-[10px] text-foreground/40 ml-1.5">{`${modKey}S`}</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </>
  )

  if (typeof document === 'undefined' || !document.body) return null
  return createPortal(content, document.body)
}
