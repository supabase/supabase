import { AnimatePresence, motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { ComponentProps } from 'react'

import { Admonition } from 'ui-patterns'

interface NoticeBarProps extends Omit<ComponentProps<typeof Admonition>, 'description'> {
  title?: string
  description?: string
  icon?: LucideIcon
  visible: boolean
  actions?: React.ReactNode
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
          <Admonition {...props}>
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
