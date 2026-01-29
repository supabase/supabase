import { Eye } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
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
  const [leftPosition, setLeftPosition] = useState<string>('50%')
  const barRef = useRef<HTMLDivElement>(null)

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

  // Calculate center position relative to grid container
  useEffect(() => {
    if (!isVisible) return

    const updatePosition = () => {
      const gridContainer = document.querySelector('.sb-grid')
      if (!gridContainer) {
        setLeftPosition('50%')
        return
      }

      const gridRect = gridContainer.getBoundingClientRect()
      const gridCenter = gridRect.left + gridRect.width / 2
      setLeftPosition(`${gridCenter}px`)
    }

    updatePosition()

    const gridContainer = document.querySelector('.sb-grid')
    if (!gridContainer) return

    const resizeObserver = new ResizeObserver(updatePosition)
    resizeObserver.observe(gridContainer)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isVisible])

  const modKey = getModKey()

  const content = (
    <AnimatePresence>
      {isVisible && (
        <div
          ref={barRef}
          className="fixed bottom-12 z-50 transform-gpu will-change-transform"
          style={{ left: leftPosition, transform: 'translateX(-50%)' }}
        >
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
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
