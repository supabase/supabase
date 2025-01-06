import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'

import { Button } from 'ui'

function InputResetButton({ isDirty, onClick }: { isDirty: boolean; onClick: () => void }) {
  return (
    <AnimatePresence initial={false}>
      {isDirty && (
        <motion.div
          key="reset-disksize"
          initial={{ opacity: 0, scale: 0.95, x: -2 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -2 }}
          transition={{ duration: 0.12 }}
        >
          <Button
            htmlType="button"
            type="default"
            size="small"
            className="px-2 text-foreground-light"
            onClick={onClick}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export { InputResetButton }
