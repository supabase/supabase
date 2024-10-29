import { AnimatePresence, motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from 'ui'

interface NoticeBarProps {
  title?: string
  description?: string
  icon?: LucideIcon
  visible: boolean
}

export function NoticeBar({
  visible,
  title = 'Project about to restart',
  description = `This project is about to restart to change compute to.`,
  icon: Icon,
}: NoticeBarProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        {visible && (
          <Card className="px-2 bg-surface-100">
            <CardContent className="py-3 flex gap-3 px-3 items-center">
              {Icon && <Icon className="text-foreground-light w-4 h-4" />}
              <div className="flex flex-col">
                <p className="text-foreground text-sm p-0">{title}</p>
                <p className="text-foreground-lighter text-sm">{description}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
