import { AnimatePresence, motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns'

interface NoticeBarProps {
  title?: string
  description?: string
  icon?: LucideIcon
  visible: boolean
  actions?: React.ReactNode
}

export function NoticeBar({ visible, title, description, actions }: NoticeBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Admonition type="default" title={title}>
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
