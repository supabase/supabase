import { IS_PLATFORM, useParams } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Badge, cn } from 'ui'

import { LayoutHeaderDivider } from './LayoutHeader'
import { BranchDropdown } from '@/components/layouts/AppLayout/BranchDropdown'
import { OrganizationDropdown } from '@/components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from '@/components/layouts/AppLayout/ProjectDropdown'
import { useOrgUsageExceedingLimits } from '@/hooks/misc/useOrgUsageExceedingLimits'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const OrgProjectBranchNav = ({ className }: { className?: string }) => {
  const { ref: projectRef, slug } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { exceedingLimits } = useOrgUsageExceedingLimits(selectedOrganization)

  const showOrgSelection = slug || (selectedOrganization && projectRef)

  return (
    <div className={cn('flex items-center', className)}>
      {showOrgSelection && IS_PLATFORM ? (
        <>
          <LayoutHeaderDivider />
          <OrganizationDropdown />
        </>
      ) : null}
      <AnimatePresence>
        {projectRef && (
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
          >
            {IS_PLATFORM && <LayoutHeaderDivider />}
            <ProjectDropdown />

            {exceedingLimits && (
              <div className="ml-2">
                <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                  <Badge variant="destructive">Exceeding usage limits</Badge>
                </Link>
              </div>
            )}

            {selectedProject && IS_PLATFORM && (
              <>
                <LayoutHeaderDivider />
                <BranchDropdown />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
