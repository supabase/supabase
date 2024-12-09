import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'

import { DialogSection, WarningIcon } from 'ui'

interface DiskMangementRestartRequiredSectionProps {
  visible: boolean
  title: string
  description: string
}

export const DiskMangementRestartRequiredSection = ({
  visible,
  title,
  description,
}: DiskMangementRestartRequiredSectionProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          <DialogSection className="bg-surface-100 text-sm text-foreground-light flex items-center gap-4 relative w-full rounded-md border-spacing-0 border">
            <div className="w-12 h-12">
              <div className="relative w-10 h-10 m-1 bg-alternative text-foreground border rounded-full flex items-center justify-center">
                <RotateCcw strokeWidth={1} />
                <WarningIcon className="absolute -right-1.5 -top-1.5" />
              </div>
            </div>
            <div className="flex flex-col gap-0 flex-grow">
              <p className="text-sm text-foreground">{title}</p>
              <p className="text-sm text-foreground-light">{description}</p>
            </div>
          </DialogSection>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
