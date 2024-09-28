import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Alert variant="default" className="px-6 py-4 rounded-none [&_svg]:left-8 pl-10">
          <InfoIcon className="w-4 h-4" />
          <AlertTitle>Disable spend cap to manage your disk</AlertTitle>
          <AlertDescription>
            To access advanced disk management features, you need to disable your spend cap. These
            features offer more flexibility and control over your database disk size.
          </AlertDescription>
          <div className="mt-3">
            <Link
              href={`/org/${org?.slug}/billing?panel=costControl`}
              className={cn(buttonVariants({ type: 'default', size: 'tiny' }))}
            >
              Disable spend cap
            </Link>
          </div>
        </Alert>
      </motion.div>
    </AnimatePresence>
  )
}
