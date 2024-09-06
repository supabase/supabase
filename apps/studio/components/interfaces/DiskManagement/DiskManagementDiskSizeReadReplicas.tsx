import { ChevronDown } from 'lucide-react'
import React, { useState } from 'react'
import {
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  InfoIcon,
  Alert_Shadcn_ as Alert,
  AlertTitle_Shadcn_ as AlertTitle,
  AlertDescription_Shadcn_ as AlertDescription,
} from 'ui'
import DiskSpaceBar from './DiskSpaceBar'
import { useDiskManagement } from './useDiskManagement'
import BillingChangeBadge from './BillingChangeBadge'
import { AnimatePresence, motion } from 'framer-motion'

interface DiskManagementDiskSizeReadReplicasProps {
  isDirty: boolean
  totalSize: number
  usedSize: number
  newTotalSize: number
}

export const DiskManagementDiskSizeReadReplicas: React.FC<
  DiskManagementDiskSizeReadReplicasProps
> = ({ isDirty, totalSize, usedSize, newTotalSize }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { replicaDiskUsed, readReplicas } = useDiskManagement()

  if (!replicaDiskUsed) return null

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
              <AlertTitle>An extra 25% disk space is provisioned for Read replicas.</AlertTitle>
              <AlertDescription>
                Each replica is billed separately
                <ul className="list-disc pl-4 my-3 flex flex-col gap-2">
                  {readReplicas.map((replica, index) => (
                    <li key={index} className="marker:text-foreground-light">
                      <div className="flex items-center gap-2">
                        <span>{replica}:</span>
                        <BillingChangeBadge
                          beforePrice={(totalSize * 0.25) / readReplicas.length}
                          afterPrice={(newTotalSize * 0.25) / readReplicas.length}
                          show={true}
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
                  <p className="text-sm text-foreground-light mb-3">
                    All read replicas are provisioned with the following:
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
      </Collapsible>
    </>
  )
}
