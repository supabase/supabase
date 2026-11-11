import { BookmarkIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { Button } from 'ui'

interface ViewSuggestionBannerProps {
  visible: boolean
  title: string
  description: string
  primaryLabel: string
  onPrimary: () => void
  onDismiss: () => void
}

export const ViewSuggestionBanner = ({
  visible,
  title,
  description,
  primaryLabel,
  onPrimary,
  onDismiss,
}: ViewSuggestionBannerProps) => {
  const content = (
    <AnimatePresence>
      {visible && (
        <div className="fixed bottom-12 z-50 left-1/2 -translate-x-1/2 px-4 w-full sm:w-auto sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.4 }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 p-3 sm:py-2 sm:pl-4 sm:pr-2 bg-surface-100 border rounded-lg shadow-lg sm:max-w-md">
              <div className="flex items-start gap-2 min-w-0">
                <BookmarkIcon size={14} className="shrink-0 mt-0.5 text-foreground-lighter" />
                <div className="flex flex-col min-w-0">
                  <p className="text-xs text-foreground">{title}</p>
                  <p className="text-xs text-foreground-light">{description}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 shrink-0">
                <Button size="tiny" variant="primary" onClick={onPrimary}>
                  {primaryLabel}
                </Button>
                <Button
                  size="tiny"
                  variant="text"
                  className="px-1"
                  icon={<XIcon size={14} />}
                  aria-label="Dismiss"
                  onClick={onDismiss}
                />
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
