import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import MotionNumber from '@number-flow/react'
import { useTheme } from 'next-themes'
import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useRemainingDurationForDiskAttributeUpdate } from 'data/config/disk-attributes-query'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useDatabaseSizeQuery } from 'data/database/database-size-query'
import { GB } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import {
  badgeVariants,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { AUTOSCALING_THRESHOLD } from './DiskManagement.constants'

interface DiskSpaceBarProps {
  form: UseFormReturn<DiskStorageSchemaType>
}

export default function DiskSpaceBar({ form }: DiskSpaceBarProps) {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { formState, watch } = form
  const isDarkMode = resolvedTheme?.includes('dark')

  const {
    data: diskUtil,
    // to do, error handling
  } = useDiskUtilizationQuery({
    projectRef: ref,
  })

  const usedSize = Math.round(((diskUtil?.metrics.fs_used_bytes ?? 0) / GB) * 100) / 100
  const totalSize = formState.defaultValues?.totalSize || 0
  const show = formState.dirtyFields.totalSize !== undefined && usedSize
  const newTotalSize = watch('totalSize')

  const usedPercentage = (usedSize / totalSize) * 100
  const resizePercentage = AUTOSCALING_THRESHOLD * 100

  const newUsedPercentage = (usedSize / newTotalSize) * 100
  const newResizePercentage = AUTOSCALING_THRESHOLD * 100

  const { project } = useProjectContext()
  const { data } = useDatabaseSizeQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { remainingDuration } = useRemainingDurationForDiskAttributeUpdate({ projectRef: ref })

  const databaseSizeBytes = data ?? 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center h-6 gap-3">
        <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
          {usedSize.toFixed(2)}
          <span>GB used of </span>
          <span className="text-foreground font-semibold -mt-[2px]">
            <MotionNumber value={newTotalSize} style={{ lineHeight: 0.8 }} className="font-mono" />
          </span>{' '}
          GB
        </span>
      </div>
      <div className="relative">
        <div
          className={cn(
            'h-[35px] relative border rounded-sm w-full transition',
            show ? 'bg-selection border border-brand-button' : 'bg-surface-300'
          )}
        >
          <AnimatePresence>
            {!show ? (
              <motion.div
                key="currentBar"
                initial={{ rotateY: 90, zIndex: 2 }}
                animate={{ rotateY: 0, zIndex: 1 }}
                exit={{ rotateY: -90, zIndex: 2 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-sm overflow-hidden"
              >
                <div className="h-full flex">
                  <div
                    className={cn(
                      usedPercentage >= 90 && remainingDuration > 0
                        ? 'bg-destructive'
                        : 'bg-foreground',
                      'relative overflow-hidden transition-all duration-500 ease-in-out'
                    )}
                    style={{ width: `${usedPercentage >= 100 ? 100 : usedPercentage}%` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'},
                            ${isDarkMode ? 'rgba(0,0,0,0.1) 1px' : 'rgba(255,255,255,0.1) 1px'},
                            transparent 1px,
                            transparent 4px
                          )`,
                      }}
                    />
                  </div>
                  <div
                    className="bg-transparent border-r transition-all duration-500 ease-in-out"
                    style={{
                      width: `${resizePercentage - usedPercentage <= 0 ? 0 : resizePercentage - usedPercentage}%`,
                    }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="newBar"
                initial={{ rotateY: -90, zIndex: 2 }}
                animate={{ rotateY: 0, zIndex: 1 }}
                exit={{ rotateY: 90, zIndex: 2 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-sm overflow-hidden"
              >
                <div className="h-full flex">
                  <div
                    className="bg-foreground relative overflow-hidden transition-all duration-500 ease-in-out"
                    style={{ width: `${newUsedPercentage >= 100 ? 100 : newUsedPercentage}%` }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            ${isDarkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'},
                            ${isDarkMode ? 'rgba(0,0,0,0.1) 1px' : 'rgba(255,255,255,0.1) 1px'},
                            transparent 1px,
                            transparent 4px
                          )`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {show && (
              <motion.span
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.12, delay: 0.12 }}
                className={cn(badgeVariants({ variant: 'success' }), 'absolute right-1 top-[5px]')}
              >
                New disk size
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={true}>
          {!show && (
            <motion.div
              key="currentSize"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.1 }}
              className="absolute h-8 w-full -mx-[2px]"
            >
              <div
                className="absolute top-0 -left-0 h-full flex items-center transition-all duration-500 ease-in-out"
                style={{ left: `${show ? newResizePercentage : resizePercentage}%` }}
              >
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <div className="absolute right-full bottom-0 border mr-2 px-2 py-1 bg-surface-400 rounded text-xs text-foreground-light whitespace-nowrap flex items-center gap-x-1">
                      Autoscaling <Info size={12} />
                    </div>
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom" className="w-[310px] flex flex-col gap-y-1">
                    <p>
                      Supabase expands your disk storage automatically when the database reached 90%
                      of the disk size. However, any disk modifications, including auto-scaling, can
                      only take place once every 6 hours.
                    </p>
                    <p>
                      If within those 6 hours you reach 95% of the disk space, your project{' '}
                      <span className="text-destructive-600">will enter read-only mode.</span>
                    </p>
                  </TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
                <div className="w-px h-full bg-border" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!show && (
        <div className="flex items-center space-x-4 text-xs text-foreground-lighter">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-foreground mr-2" />
            <span>Used Space</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-border border border-strong mr-2" />
            <span>Available space</span>
          </div>
        </div>
      )}
      <p className="text-xs text-foreground-lighter my-4">
        <span className="font-semibold">Note:</span> Disk Size refers to the total space your
        project occupies on disk, including the database itself (currently{' '}
        <span>{formatBytes(databaseSizeBytes, 2, 'GB')}</span>), additional files like the
        write-ahead log (WAL), and other internal resources.
      </p>
    </div>
  )
}
