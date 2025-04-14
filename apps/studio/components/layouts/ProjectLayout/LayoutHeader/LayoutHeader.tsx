import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode, useMemo } from 'react'

import { useParams } from 'common'
import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import Connect from 'components/interfaces/Connect/Connect'
import { ThemeDropdown } from 'components/interfaces/ThemeDropdown'
import { UserDropdown } from 'components/interfaces/UserDropdown'
import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import InlineEditorButton from 'components/layouts/AppLayout/InlineEditorButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useShowLayoutHeader } from 'hooks/misc/useShowLayoutHeader'
import { IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { Badge, cn } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import { HomeIcon } from './HomeIcon'
import { LocalVersionPopover } from './LocalVersionPopover'
import NotificationsPopoverV2 from './NotificationsPopoverV2/NotificationsPopover'

const LayoutHeaderDivider = ({ className, ...props }: React.HTMLProps<HTMLSpanElement>) => (
  <span className={cn('text-border-stronger pr-2', className)} {...props}>
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)

interface LayoutHeaderProps {
  customHeaderComponents?: ReactNode
  breadcrumbs?: any[]
  showProductMenu?: boolean
  headerTitle?: string
}

const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  showProductMenu,
  headerTitle,
}: LayoutHeaderProps) => {
  const newLayoutPreview = useNewLayout()

  const showLayoutHeader = useShowLayoutHeader()
  const { ref: projectRef, slug } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true
  const { setMobileMenuOpen } = useAppStateSnapshot()

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganization?.slug,
  })

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: subscription?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  // show org selection if we are on a project page or on a explicit org route
  const showOrgSelection = slug || (selectedOrganization && projectRef)

  return (
    <header className={cn('flex h-12 items-center flex-shrink-0 border-b')}>
      <div
        className={cn(
          'flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4'
        )}
      >
        <div className="flex items-center text-sm">
          <HomeIcon />
          <>
            <div className="flex items-center md:pl-2">
              {showOrgSelection &&
              // hides org dropdown for old layout
              (newLayoutPreview || showLayoutHeader) &&
              IS_PLATFORM ? (
                <>
                  <LayoutHeaderDivider className="hidden md:block" />
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
                    <LayoutHeaderDivider />
                    <ProjectDropdown />

                    {exceedingLimits && (
                      <div className="ml-2">
                        <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                          <Badge variant="destructive">Exceeding usage limits</Badge>
                        </Link>
                      </div>
                    )}

                    {selectedProject && isBranchingEnabled && (
                      <>
                        <LayoutHeaderDivider />
                        <BranchDropdown />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {headerTitle && (
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
                    <LayoutHeaderDivider />
                    <span className="text-foreground">{headerTitle}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {projectRef && (
                <motion.div
                  className="ml-3 items-center gap-x-3 hidden md:flex"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                  }}
                >
                  <Connect />
                  {!isBranchingEnabled && IS_PLATFORM && <EnableBranchingButton />}
                </motion.div>
              )}
            </AnimatePresence>
          </>
          <BreadcrumbsView defaultValue={breadcrumbs} />
        </div>
        <div className="flex items-center gap-x-2">
          {customHeaderComponents && customHeaderComponents}
          {IS_PLATFORM ? (
            <>
              <FeedbackDropdown />
              <NotificationsPopoverV2 />
              <HelpPopover />
              <UserDropdown />
            </>
          ) : (
            <>
              <LocalVersionPopover />
              <ThemeDropdown />
            </>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!!projectRef && (
          <motion.div
            className="border-l h-full flex items-center justify-center flex-shrink-0"
            initial={{ opacity: 0, x: 0, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="border-r h-full flex items-center justify-center px-2">
              <InlineEditorButton />
            </div>
            <div className="px-2">
              <AssistantButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default LayoutHeader
