import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Admonition } from 'ui-patterns/admonition'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DISK_LIMITS, DISK_TYPE_OPTIONS, DiskType } from './DiskManagement.constants'

export function DiskTypeRecommendationSection({
  actions,
  form,
}: {
  actions?: ReactNode
  form: UseFormReturn<DiskStorageSchemaType>
}) {
  const { watch } = form

  const totalSize = watch('totalSize')
  const storageType = watch('storageType')
  const isVisible = storageType === DiskType.GP3 && totalSize > DISK_LIMITS[DiskType.GP3].maxStorage
  const io2Option = DISK_TYPE_OPTIONS.find((option) => option.type === DiskType.IO2)

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
            title={`You will need to use ${io2Option?.name} to use a larger Disk size`}
          >
            <div className="flex flex-col gap-2">{actions && <div>{actions}</div>}</div>
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
