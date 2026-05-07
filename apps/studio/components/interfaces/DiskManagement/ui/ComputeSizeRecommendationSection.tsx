import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Admonition } from 'ui-patterns/admonition'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import {
  calculateComputeSizeRequiredForIops,
  calculateMaxIopsForComputeSize,
  mapAddOnVariantIdToComputeSize,
} from '../DiskManagement.utils'
import { COMPUTE_BASELINE_IOPS, COMPUTE_MAX_IOPS } from 'shared-data'
import { RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3 } from './DiskManagement.constants'

interface ComputeSizeRecommendationSectionProps {
  actions?: ReactNode
  form: UseFormReturn<DiskStorageSchemaType>
}

export function ComputeSizeRecommendationSection({
  actions,
  form,
}: ComputeSizeRecommendationSectionProps) {
  const { watch } = form
  const computeSize = watch('computeSize')
  const iops = watch('provisionedIOPS')

  const computeSizeRecommendedForIops = calculateComputeSizeRequiredForIops(iops)
  const maxIopsForComputeSize = calculateMaxIopsForComputeSize(computeSize ?? 'ci_micro')
  const isVisible =
    iops > maxIopsForComputeSize &&
    !RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(computeSize ?? 'ci_micro')

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Admonition
            type="default"
            title={`Your compute size baseline is ${COMPUTE_BASELINE_IOPS[computeSize ?? 'ci_micro']} IOPS (max ${COMPUTE_MAX_IOPS[computeSize ?? 'ci_micro'] ?? maxIopsForComputeSize} IOPS)`}
          >
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm text-foreground-light">
                  To achieve higher IOPS performance we recommend using the{' '}
                  <span className="text-foreground">
                    {mapAddOnVariantIdToComputeSize(computeSizeRecommendedForIops)}
                  </span>{' '}
                  compute size.
                </p>
              </div>
              {actions && <div>{actions}</div>}
            </div>
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
