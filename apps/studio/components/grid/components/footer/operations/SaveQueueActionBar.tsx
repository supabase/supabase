import { AnimatePresence, motion } from 'framer-motion'
import { Eye, MoreVertical, Trash } from 'lucide-react'
import { createPortal } from 'react-dom'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { useOperationQueueActions } from '@/components/grid/hooks/useOperationQueueActions'
import { useOperationQueueShortcuts } from '@/components/grid/hooks/useOperationQueueShortcuts'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

export const SaveQueueActionBar = () => {
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
                <p className="text-xs text-foreground-light max-w-40 truncate">
                  {operationCount} pending change{operationCount !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-x-2">
                  <Button
                    size="tiny"
                    type="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    loading={isSaving}
                    iconRight={
                      isSaving ? undefined : (
                        <KeyboardShortcut keys={['Meta', 's']} variant="inline" />
                      )
                    }
                  >
                    Save
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="outline"
                        className="w-7"
                        icon={<MoreVertical />}
                        aria-label="More options"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem
                        className="justify-between"
                        onClick={() => snap.toggleViewOperationQueue()}
                      >
                        <div className="flex items-center gap-x-2">
                          <Eye size={14} />
                          <span>Review</span>
                        </div>
                        <KeyboardShortcut keys={['Meta', '.']} />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={confirmOnClose}>
                        <div className="flex items-center gap-x-2">
                          <Trash size={14} />
                          <span>Discard</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
