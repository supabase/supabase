import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import {
  calculateComputeSizeRequiredForIops,
  calculateMaxIopsAllowedForComputeSize,
} from '../DiskManagement.utils'

import { Button, DialogSection, WarningIcon } from 'ui'
import { RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3 } from './DiskManagement.constants'
import { ComputeBadge } from 'ui-patterns'

export function ComputeSizeReccomendationSection({
  iops,
  computeSize,
  actions,
}: {
  iops: number
  computeSize: string
  actions?: React.ReactNode
}) {
  const compute = calculateComputeSizeRequiredForIops(iops)
  const maxIOPSforComputeSize = calculateMaxIopsAllowedForComputeSize(computeSize ?? 'ci_micro')
  const isVisible =
    iops > maxIOPSforComputeSize && !RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(computeSize)

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <DialogSection className="bg-alternative text-sm text-foreground-light flex items-start gap-4 relative w-full border rounded-md">
            <WarningIcon />
            <div className="flex flex-col gap-2 flex-grow">
              <div>
                <p className="text-sm text-foreground">{compute} Compute size is recommended.</p>
                <span className="text-sm text-foreground-light">
                  To achieve optimal IOPS performance use{' '}
                  <span className="text-foreground">{compute}</span> compute size.
                </span>
              </div>
              {actions && <div>{actions}</div>}
            </div>
          </DialogSection>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
