import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'
import { UseFormReturn, useWatch } from 'react-hook-form'
import { COMPUTE_BASELINE_IOPS } from 'shared-data'
import { Admonition } from 'ui-patterns/Admonition'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import {
  calculateComputeSizeRequiredForIops,
  calculateMaxIopsForComputeSize,
  mapAddOnVariantIdToComputeSize,
  mapComputeSizeNameToAddonVariantId,
} from '../DiskManagement.utils'
import { RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3 } from './DiskManagement.constants'
import { useProjectDiskLimits } from '@/hooks/misc/useProjectDiskLimits'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface ComputeSizeRecommendationSectionProps {
  actions?: ReactNode
  form: UseFormReturn<DiskStorageSchemaType>
}

export function ComputeSizeRecommendationSection({
  actions,
  form,
}: ComputeSizeRecommendationSectionProps) {
  const [computeSize, iops] = useWatch({
    control: form.control,
    name: ['computeSize', 'provisionedIOPS'],
  })
  const { data: project } = useSelectedProjectQuery()
  const { limits, isPerInstance, isBurstable } = useProjectDiskLimits()

  const selectedComputeSize = computeSize ?? 'ci_micro'
  // Exact instance limits only apply to the compute size the project currently
  // runs on; a different selection lands on an unknown configuration, so it
  // falls back to that size's floors.
  const isCurrentComputeSelected =
    isPerInstance &&
    limits !== undefined &&
    project?.infra_compute_size !== undefined &&
    selectedComputeSize === mapComputeSizeNameToAddonVariantId(project.infra_compute_size)

  const baselineIops =
    isCurrentComputeSelected && limits
      ? limits.baselineIops
      : (COMPUTE_BASELINE_IOPS[selectedComputeSize] ?? 0)
  const maxIops =
    isCurrentComputeSelected && limits
      ? limits.maxIops
      : calculateMaxIopsForComputeSize(selectedComputeSize)

  const computeSizeRecommendedForIops = calculateComputeSizeRequiredForIops(iops)
  const isRestrictedCompute = RESTRICTED_COMPUTE_FOR_IOPS_ON_GP3.includes(selectedComputeSize)
  const showUpgradeRecommendation = iops > maxIops && !isRestrictedCompute
  const showBurstHint =
    !showUpgradeRecommendation &&
    isCurrentComputeSelected &&
    isBurstable &&
    iops > baselineIops &&
    !isRestrictedCompute

  return (
    <AnimatePresence initial={false}>
      {(showUpgradeRecommendation || showBurstHint) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Admonition
            type="default"
            title={`Your compute size baseline is ${baselineIops} IOPS (max ${maxIops} IOPS)`}
          >
            <div className="flex flex-col gap-2">
              <div>
                {showUpgradeRecommendation ? (
                  <p className="text-sm text-foreground-light">
                    To achieve higher IOPS performance we recommend using the{' '}
                    <span className="text-foreground">
                      {mapAddOnVariantIdToComputeSize(computeSizeRecommendedForIops)}
                    </span>{' '}
                    compute size.
                  </p>
                ) : (
                  <p className="text-sm text-foreground-light">
                    IOPS above the baseline is served from your compute's IO burst capacity and
                    cannot be sustained indefinitely.
                  </p>
                )}
              </div>
              {actions && showUpgradeRecommendation && <div>{actions}</div>}
            </div>
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
