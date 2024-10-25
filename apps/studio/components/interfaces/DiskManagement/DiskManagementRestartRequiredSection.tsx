import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, X } from 'lucide-react'
import React, { useState } from 'react'

import { DialogSection, TableCell, TableRow } from 'ui'

export const DiskMangementRestartRequiredSection: React.FC = () => {
  const [progress, setProgress] = useState(100)
  const [showCountdown, setShowCountdown] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full"
        >
          <DialogSection className="bg-surface-100 text-sm text-foreground-light flex items-center gap-4 relative w-full border rounded-md">
            <div className="w-12 h-12 opacity-75">
              <div className="w-10 h-10 m-1 bg-studio border rounded-md flex items-center justify-center">
                <RotateCcw strokeWidth={1} />
              </div>
            </div>
            <div className="flex flex-col gap-0 flex-grow">
              <p className="text-sm text-foreground">A Project restart will be required.</p>
              <p className="text-sm text-foreground-light">
                You can restart after confirming changes or when convenient.
              </p>
            </div>
            <button
              type="button"
              className="text-foreground-lighter hover:text-foreground-light transition-colors self-start p-1"
              onClick={() => setIsVisible(false)}
            >
              <X size={14} />
            </button>
          </DialogSection>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
