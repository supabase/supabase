import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Alert_Shadcn_ as Alert,
  AlertDescription_Shadcn_ as AlertDescription,
  AlertTitle_Shadcn_ as AlertTitle,
  buttonVariants,
  cn,
  InfoIcon,
} from 'ui'

export function DiskManagementPlanUpgradeRequired() {
  const org = useSelectedOrganization()
  const { data } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isPlanUpgradeRequired = data?.plan.id === 'free'

  return (
    <AnimatePresence>
      {isPlanUpgradeRequired && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Alert variant="default" className="px-6 py-4 rounded-none [&_svg]:left-8 pl-10">
            <InfoIcon className="w-4 h-4" />
            <AlertTitle className="mb-2">Plan Upgrade Required</AlertTitle>
            <AlertDescription>
              To access advanced disk management features, you need to upgrade your plan. These
              features are available on our higher tier plans, offering more flexibility and control
              over your database storage.
            </AlertDescription>
            <div className="mt-4">
              <Link
                href={`/org/${org?.slug}/billing`}
                className={cn(buttonVariants({ type: 'default', size: 'small' }))}
              >
                Upgrade your plan
              </Link>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
