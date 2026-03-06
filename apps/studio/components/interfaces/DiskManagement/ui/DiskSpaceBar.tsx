import MotionNumber from '@number-flow/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import { UseFormReturn } from 'react-hook-form'

import { useParams } from 'common'
import { useDiskBreakdownQuery } from 'data/config/disk-breakdown-query'
import { useDiskUtilizationQuery } from 'data/config/disk-utilization-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GB } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useMemo } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { AUTOSCALING_THRESHOLD } from './DiskManagement.constants'

interface DiskSpaceBarProps {
  form: UseFormReturn<DiskStorageSchemaType>
}

export const DiskSpaceBar = ({ form }: DiskSpaceBarProps) => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { formState, watch } = form
  const isDarkMode = resolvedTheme?.includes('dark')
  const { data: project } = useSelectedProjectQuery()

  const {
    data: diskUtil,
    // to do, error handling
  } = useDiskUtilizationQuery({
    projectRef: ref,
  })

  const { data: diskBreakdown } = useDiskBreakdownQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const diskBreakdownBytes = useMemo(() => {
    return {
      availableBytes: diskUtil?.metrics.fs_avail_bytes ?? 0,
      totalUsedBytes: diskUtil?.metrics.fs_used_bytes ?? 0,
      totalDiskSizeBytes: diskUtil?.metrics.fs_size_bytes,
      dbSizeBytes: Math.max(0, diskBreakdown?.db_size_bytes ?? 0),
      walSizeBytes: Math.max(0, diskBreakdown?.wal_size_bytes ?? 0),
      systemBytes: Math.max(
        0,
        (diskUtil?.metrics.fs_used_bytes ?? 0) -
          (diskBreakdown?.db_size_bytes ?? 0) -
          (diskBreakdown?.wal_size_bytes ?? 0)
      ),
    }
  }, [diskUtil, diskBreakdown])

  const showNewSize = formState.dirtyFields.totalSize !== undefined && diskBreakdown
  const newTotalSize = watch('totalSize')

  const totalSize = formState.defaultValues?.totalSize || 0
  const usedSizeTotal = Math.round(((diskBreakdownBytes?.totalUsedBytes ?? 0) / GB) * 100) / 100
  const usedTotalPercentage = Math.min((usedSizeTotal / totalSize) * 100, 100)

  const usedSizeDatabase = Math.round(((diskBreakdownBytes?.dbSizeBytes ?? 0) / GB) * 100) / 100
  const usedPercentageDatabase =
    totalSize === 0 ? 0 : Math.min((usedSizeDatabase / totalSize) * 100, 100)
  const newUsedPercentageDatabase = Math.min((usedSizeDatabase / newTotalSize) * 100, 100)

  const usedSizeWAL = Math.round(((diskBreakdownBytes?.walSizeBytes ?? 0) / GB) * 100) / 100
  const usedPercentageWAL = totalSize === 0 ? 0 : Math.min((usedSizeWAL / totalSize) * 100, 100)
  const newUsedPercentageWAL = Math.min((usedSizeWAL / newTotalSize) * 100, 100)

  const usedSizeSystem = Math.round(((diskBreakdownBytes?.systemBytes ?? 0) / GB) * 100) / 100
  const usedPercentageSystem =
    totalSize === 0 ? 0 : Math.min((usedSizeSystem / totalSize) * 100, 100)
  const newUsedPercentageSystem = Math.min((usedSizeSystem / newTotalSize) * 100, 100)

  const resizePercentage = AUTOSCALING_THRESHOLD * 100
  const newResizePercentage = AUTOSCALING_THRESHOLD * 100

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center h-6 gap-3">
        <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
          {usedSizeTotal.toFixed(2)}
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
            'h-[35px] relative border rounded-sm w-full transition overflow-visible',
            showNewSize ? 'bg-selection border border-brand' : 'bg-surface-300'
          )}
        >
          <AnimatePresence>
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
                  className="relative overflow-hidden transition-all duration-500 ease-in-out bg-foreground"
                  style={{
                    width: `${showNewSize ? newUsedPercentageDatabase : usedPercentageDatabase}%`,
                  }}
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
                  className="relative overflow-hidden transition-all duration-500 ease-in-out bg-_secondary"
                  style={{
                    width: `${showNewSize ? newUsedPercentageWAL : usedPercentageWAL}%`,
                  }}
                />

                <div
                  className="relative overflow-hidden transition-all duration-500 ease-in-out bg-destructive-500"
                  style={{
                    width: `${showNewSize ? newUsedPercentageSystem : usedPercentageSystem}%`,
                  }}
                />

                {!showNewSize && (
                  <div
                    className="bg-transparent-800 border-r transition-all duration-500 ease-in-out"
                    style={{
                      width: `${resizePercentage - usedTotalPercentage <= 0 ? 0 : resizePercentage - usedTotalPercentage}%`,
                    }}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {showNewSize && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.12, delay: 0.12 }}
                className="absolute right-2 top-0 flex items-center h-full"
              >
                <Badge variant="success">New disk size</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={true}>
          {!showNewSize && (
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
                style={{ left: `${showNewSize ? newResizePercentage : resizePercentage}%` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute right-full bottom-0 border mr-2 px-2 py-1 bg-surface-400 rounded text-xs text-foreground-light whitespace-nowrap flex items-center gap-x-1">
                      Autoscaling <Info size={12} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="w-[310px] flex flex-col gap-y-1">
                    <p>
                      Supabase expands your disk storage automatically when the database reached 90%
                      of the disk size. However, any disk modifications, including auto-scaling, can
                      only take place once every 4 hours.
                    </p>
                    <p>
                      If within those 4 hours you reach 95% of the disk space, your project{' '}
                      <span className="text-destructive-600">will enter read-only mode.</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="w-px h-full bg-border" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!showNewSize && (
        <div className="flex items-center space-x-3 text-xs text-foreground-lighter">
          <LegendItem
            name="Database"
            size={diskBreakdownBytes.dbSizeBytes}
            color="bg-foreground"
            description="Total space on disk used by your database (tables, indexes, data, ...)."
          />
          <LegendItem
            name="WAL"
            size={diskBreakdownBytes.walSizeBytes}
            color="bg-_secondary"
            description="Total space on disk used by the write-ahead log."
          />

          <LegendItem
            name="System"
            size={diskBreakdownBytes.systemBytes}
            color="bg-destructive-500"
            description="Reserved space for the system to ensure your database runs smoothly. You cannot modify this."
          />

          <LegendItem
            name="Available space"
            size={diskBreakdownBytes.availableBytes}
            color="bg-border"
            description="Total available space on the disk left."
          />
        </div>
      )}
      <p className="text-xs text-foreground-lighter my-4">
        <span className="font-semibold">Note:</span> Disk Size refers to the total space your
        project occupies on disk, including the database itself (currently{' '}
        <span>{formatBytes(diskBreakdownBytes?.dbSizeBytes, 2, 'GB')}</span>), additional files like
        the write-ahead log (currently{' '}
        <span>{formatBytes(diskBreakdownBytes?.walSizeBytes, 2, 'GB')}</span>), and other system
        resources (currently <span>{formatBytes(diskBreakdownBytes?.systemBytes, 2, 'GB')}</span>).
        Data can take 5 minutes to refresh.
      </p>
    </div>
  )
}

const LegendItem = ({
  name,
  description,
  color,
  size,
}: {
  name: string
  description: string
  color: string
  size: number
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center hover:cursor-help z-10">
        <div className={cn('w-2 h-2 rounded-full mr-2', color)} />
        <span>{name}</span>
      </div>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="flex flex-col gap-y-1 max-w-xs">
      <div className="flex items-center">
        <div className={cn('w-2 h-2 rounded-full mr-2', color)} />
        <span>
          {name} - {formatBytes(size, 2, 'GB')}
        </span>
      </div>
      <p>{description}</p>
    </TooltipContent>
  </Tooltip>
)
