import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import {
  AlertDescription_Shadcn_ as AlertDescription,
  AlertTitle_Shadcn_ as AlertTitle,
  buttonVariants,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface SpendCapDisabledSectionProps {
  currentDiskSizeGb?: number
}

export function SpendCapDisabledSection({ currentDiskSizeGb }: SpendCapDisabledSectionProps) {
  const { data: org, isPending: isOrgPending } = useSelectedOrganizationQuery()
  const { data: project, isPending: isProjectPending } = useSelectedProjectQuery()

  const isSpendCapEnabled =
    !isOrgPending &&
    !isProjectPending &&
    org?.plan.id !== 'free' &&
    !org?.usage_billing_enabled &&
    project?.cloud_provider !== 'FLY'

  const showAutoExpandNotice =
    isSpendCapEnabled &&
    currentDiskSizeGb !== undefined &&
    currentDiskSizeGb > 0 &&
    currentDiskSizeGb < 8

  return (
    <AnimatePresence>
      {isSpendCapEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {showAutoExpandNotice && (
            <Admonition type="default">
              <AlertTitle>Your disk will auto-expand to 8 GB</AlertTitle>
              <AlertDescription>
                The first time your database usage triggers a resize, your disk will automatically
                expand to at least 8 GB. You don&apos;t need to disable spend cap or do anything
                manually for this to happen.
              </AlertDescription>
            </Admonition>
          )}
          <Admonition type="default">
            <AlertTitle>Spend cap limits disk size to 8 GB</AlertTitle>
            <AlertDescription>
              You can resize your disk up to 8 GB with spend cap enabled. To expand beyond 8 GB or
              configure IOPS, throughput, and storage type, disable your spend cap.
            </AlertDescription>
            <div className="mt-3">
              <Link
                href={`/org/${org?.slug}/billing?panel=costControl`}
                className={cn(buttonVariants({ type: 'default', size: 'tiny' }))}
              >
                Disable spend cap
              </Link>
            </div>
          </Admonition>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
