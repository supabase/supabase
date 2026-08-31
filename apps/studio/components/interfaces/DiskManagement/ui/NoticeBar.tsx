import { AnimatePresence, motion } from 'framer-motion'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { type AdmonitionProps } from 'ui-patterns/Admonition/Admonition.types'

// Temporary animation shim while callers migrate to Admonition from ui-patterns.
interface NoticeBarProps extends AdmonitionProps {
  visible: boolean
}

export function NoticeBar({ visible, description, actions, ...props }: NoticeBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: 4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: 4 }}
          transition={{ duration: 0.15 }}
        >
          <Admonition
            {...props}
            description={description}
            actions={actions}
            className={cn(props.className, 'mb-0')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
