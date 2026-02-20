import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'
import { useOperationQueueShortcuts } from 'components/grid/hooks/useOperationQueueShortcuts'
import { useIsQueueOperationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button } from 'ui'
import { useEffect, useRef, useState } from 'react'
import { getModKeyLabel } from '@/lib/helpers'

export const SaveQueueActionBar = () => {
  const modKey = getModKeyLabel()
  const snap = useTableEditorStateSnapshot()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const { handleSave } = useOperationQueueActions()
  const [leftPosition, setLeftPosition] = useState<string>('50%')

  useOperationQueueShortcuts()

  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'
  const isOperationQueuePanelOpen = snap.sidePanel?.type === 'operation-queue'

  const isVisible =
    isQueueOperationsEnabled && snap.hasPendingOperations && !isOperationQueuePanelOpen

  // Center position relative to grid container (viewport alignment)
  useEffect(() => {
    if (!isVisible) return

    const gridContainer = document.querySelector('.sb-grid')
    const updatePosition = () => {
      if (!gridContainer) {
        setLeftPosition('50%')
        return
      }

      const gridRect = gridContainer.getBoundingClientRect()
      const gridCenter = gridRect.left + gridRect.width / 2
      setLeftPosition(`${gridCenter}px`)
    }

    updatePosition()

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

  const content = (
    <AnimatePresence>
      {isVisible && (
        <div
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
                <Button type="default" size="tiny" onClick={() => snap.toggleViewOperationQueue()}>
                  Review{' '}
                  <span className="text-[10px] text-foreground/40 ml-1.5">{`${modKey}.`}</span>
                </Button>
                <Button
                  size="tiny"
                  type="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  loading={isSaving}
                >
                  Save{operationCount > 1 && ' all'}
                  <span className="text-[10px] text-foreground/40 ml-1.5">{`${modKey}S`}</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined' || !document.body) return null
  return createPortal(content, document.body)
}
