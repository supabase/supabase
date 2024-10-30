import { AnimatePresence, motion } from 'framer-motion'
import { Admonition } from 'ui-patterns/admonition'
import {
  calculateComputeSizeRequiredForIops,
  calculateMaxIopsAllowedForComputeSize,
  mapAddOnVariantIdToComputeSize,
} from '../DiskManagement.utils'
import {
  COMPUTE_BASELINE_IOPS,
  RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3,
} from './DiskManagement.constants'
import { UseFormReturn } from 'react-hook-form'
import { DiskStorageSchemaType } from '../DiskManagement.schema'

export function ComputeSizeReccomendationSection({
  actions,
  form,
}: {
  actions?: React.ReactNode
  form: UseFormReturn<DiskStorageSchemaType>
}) {
  const { watch } = form
  const computeSize = watch('computeSize')
  const iops = watch('provisionedIOPS')
  const computeSizeRecommendedForIops = calculateComputeSizeRequiredForIops(iops)
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
          <Admonition
            type="default"
            title={`Your instance can only support a baseline IOPS of ${COMPUTE_BASELINE_IOPS[computeSize]}`}
          >
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-sm text-foreground-light">
                  To achieve sustained IOPS performance we recommend using{' '}
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
