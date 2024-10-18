import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { useParams } from 'common'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import {
  Alert_Shadcn_ as Alert,
  AlertDescription_Shadcn_ as AlertDescription,
  AlertTitle_Shadcn_ as AlertTitle,
  InfoIcon,
} from 'ui'
import BillingChangeBadge from './BillingChangeBadge'
import { DISK_LIMITS, DISK_PRICING, DiskType } from './DiskManagement.constants'

interface DiskManagementDiskSizeReadReplicasProps {
  isDirty: boolean
  totalSize: number
  usedSize: number
  newTotalSize: number
  oldStorageType: DiskType
  newStorageType: DiskType
}

export const DiskManagementDiskSizeReadReplicas = ({
  isDirty,
  totalSize,
  usedSize,
  newTotalSize,
  oldStorageType,
  newStorageType,
}: DiskManagementDiskSizeReadReplicasProps) => {
  const { ref: projectRef } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const { data: databases } = useReadReplicasQuery({ projectRef })
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)
  const beforePrice = totalSize * DISK_PRICING[oldStorageType]?.storage ?? 0
  const afterPrice = newTotalSize * DISK_PRICING[newStorageType]?.storage ?? 0

  if (readReplicas.length === 0) return null

  return (
    <>
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="default" className="bg-transparent">
              <InfoIcon />
              <AlertTitle>
                Read replicas are provisioned with extra 25% disk size to account for WAL files
              </AlertTitle>
              <AlertDescription>
                Each replica will have a disk size of {newTotalSize}GB, and are billed separately
                <ul className="list-disc pl-4 my-3 flex flex-col gap-2">
                  {readReplicas.map((replica, index) => (
                    <li key={index} className="marker:text-foreground-light">
                      <div className="flex items-center gap-2">
                        <span>
                          ID: {formatDatabaseID(replica.identifier)} ({replica.region}):
                        </span>
                        <BillingChangeBadge
                          show
                          beforePrice={beforePrice}
                          afterPrice={afterPrice}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hide for now until we have the utilization for each RR specifically */}
      {/* <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center cursor-pointer rounded gap-2 mt-3 text-foreground-light hover:text-foreground data-[state=open]:text-foreground group">
            <h3 className="text-sm">Read replica disk size information</h3>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 group-data-[state=open]:transform group-data-[state=open]:rotate-180 group-data-[state=open]:text-foreground`}
            />
          </div>
        </CollapsibleTrigger>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
              }}
              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            >
              <CollapsibleContent className="pt-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="flex flex-col gap-y-1 text-sm text-foreground-light mb-3">
                    <span className="text-foreground-lighter">
                      Read replicas have 25% more disk size than the primary database to account for
                      WAL files{' '}
                    </span>
                  </p>
                  <DiskSpaceBar
                    showNewBar={isDirty}
                    totalSize={totalSize}
                    usedSize={usedSize}
                    newTotalSize={newTotalSize}
                  />
                </motion.div>
              </CollapsibleContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Collapsible> */}
    </>
  )
}

export const DiskManagementIOPSReadReplicas = ({
  isDirty,
  oldIOPS,
  newIOPS,
  oldStorageType,
  newStorageType,
}: {
  isDirty: boolean
  oldIOPS: number
  newIOPS: number
  oldStorageType: DiskType
  newStorageType: DiskType
}) => {
  const { ref: projectRef } = useParams()
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)

  const beforePrice =
    (oldIOPS - DISK_LIMITS[oldStorageType]?.includedIops) * DISK_PRICING[oldStorageType]?.iops ?? 0
  const afterPrice =
    (newIOPS - DISK_LIMITS[newStorageType]?.includedIops) * DISK_PRICING[newStorageType]?.iops ?? 0

  if (readReplicas.length === 0) return null

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="default" className="bg-transparent">
            <InfoIcon />
            <AlertTitle>Read replica IOPS will also be updated to the same value</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 my-3 flex flex-col gap-2">
                {readReplicas.map((replica, index) => (
                  <li key={index} className="marker:text-foreground-light">
                    <div className="flex items-center gap-2">
                      <span>
                        ID: {formatDatabaseID(replica.identifier)} ({replica.region}):
                      </span>
                      <BillingChangeBadge show beforePrice={beforePrice} afterPrice={afterPrice} />
                    </div>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const DiskManagementThroughputReadReplicas = ({
  isDirty,
  oldThroughput,
  newThroughput,
  oldStorageType,
  newStorageType,
}: {
  isDirty: boolean
  oldThroughput: number
  newThroughput: number
  oldStorageType: DiskType
  newStorageType: DiskType
}) => {
  const { ref: projectRef } = useParams()
  const { data: databases } = useReadReplicasQuery({ projectRef })
  const readReplicas = (databases ?? []).filter((db) => db.identifier !== projectRef)

  const beforePrice =
    oldStorageType === DiskType.GP3
      ? (oldThroughput - DISK_LIMITS[oldStorageType].includedThroughput) *
          DISK_PRICING[oldStorageType]?.throughput ?? 0
      : 0
  const afterPrice =
    newStorageType === DiskType.GP3
      ? (newThroughput - DISK_LIMITS[newStorageType].includedThroughput) *
          DISK_PRICING[newStorageType]?.throughput ?? 0
      : 0

  if (readReplicas.length === 0) return null

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="default" className="bg-transparent">
            <InfoIcon />
            <AlertTitle>Read replica throughput will also be updated to the same value</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 my-3 flex flex-col gap-2">
                {readReplicas.map((replica, index) => (
                  <li key={index} className="marker:text-foreground-light">
                    <div className="flex items-center gap-2">
                      <span>
                        ID: {formatDatabaseID(replica.identifier)} ({replica.region}):
                      </span>
                      <BillingChangeBadge show beforePrice={beforePrice} afterPrice={afterPrice} />
                    </div>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
