import { AnimatePresence, motion } from 'framer-motion'
import { type ComponentProps, type ReactNode } from 'react'
import { cn } from 'ui'

import { Admonition } from 'ui-patterns'

/**
 * @deprecated Use Admonition from ui-patterns instead
 * Pass actions as a prop to the Admonition component
 */

interface NoticeBarProps extends Omit<ComponentProps<typeof Admonition>, 'description'> {
  title?: string
  description?: string
  icon?: ReactNode
  visible: boolean
  actions?: ReactNode
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
          <Admonition {...props} className={cn(props.className, 'mb-0')}>
            {description}
            <div className="flex flex-col gap-2">
              {actions && <div className="mt-2">{actions}</div>}
            </div>
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
