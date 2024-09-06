import {
  Alert_Shadcn_ as Alert,
  AlertDescription_Shadcn_ as AlertDescription,
  AlertTitle_Shadcn_ as AlertTitle,
  cn,
  buttonVariants,
  InfoIcon,
} from 'ui'

import Link from 'next/link'
import { useDiskManagement } from './useDiskManagement'
import { AnimatePresence, motion } from 'framer-motion'

export function DiskManagementPlanUpgradeRequired() {
  const { plan } = useDiskManagement()
  const isPlanUpgradeRequired = plan === 'tier_free'

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
                href="/project/[ref]/settings/billing"
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
