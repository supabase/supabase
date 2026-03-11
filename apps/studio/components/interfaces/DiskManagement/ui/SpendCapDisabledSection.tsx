import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_ as AlertDescription,
  AlertTitle_Shadcn_ as AlertTitle,
  buttonVariants,
  cn,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export function SpendCapDisabledSection() {
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const isSpendCapEnabled =
    org?.plan.id !== 'free' && !org?.usage_billing_enabled && project?.cloud_provider !== 'FLY'

  return (
    <AnimatePresence>
      {isSpendCapEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Admonition type="default">
            <AlertTitle>Disable spend cap to manage Disk configuration</AlertTitle>
            <AlertDescription>
              To access disk management features, you need to disable your spend cap. These features
              offer more flexibility and control over your database disk size.
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
