import { BookmarkIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from 'ui'

interface ViewSuggestionBannerProps {
  visible: boolean
  title: string
  description: string
  primaryLabel: string
  onPrimary: () => void
  onDismiss: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

export const ViewSuggestionBanner = ({
  visible,
  title,
  description,
  primaryLabel,
  onPrimary,
  onDismiss,
  secondaryLabel,
  onSecondary,
}: ViewSuggestionBannerProps) => (
  <AnimatePresence initial={false}>
    {visible && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.4 }}
        className="overflow-hidden shrink-0"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 px-2 py-3 border-b bg-surface-100">
          <div className="flex items-center gap-2 min-w-0">
            <BookmarkIcon size={16} className="shrink-0 mx-1.5 text-foreground-lighter" />
            <div className="flex flex-col min-w-0">
              <p className="text-xs text-foreground">{title}</p>
              <p className="text-xs text-foreground-light">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {secondaryLabel && onSecondary && (
              <Button size="tiny" variant="default" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            )}
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
    )}
  </AnimatePresence>
)
