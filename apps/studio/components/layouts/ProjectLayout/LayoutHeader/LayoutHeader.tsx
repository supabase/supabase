import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode, useMemo } from 'react'

import { useParams } from 'common'
import { useIsBranching2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { Connect } from 'components/interfaces/Connect/Connect'
import { LocalDropdown } from 'components/interfaces/LocalDropdown'
import { UserDropdown } from 'components/interfaces/UserDropdown'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import { BranchDropdown } from 'components/layouts/AppLayout/BranchDropdown'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { Badge, cn } from 'ui'
import { BreadcrumbsView } from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import { HelpPopover } from './HelpPopover'
import { HomeIcon } from './HomeIcon'
import { LocalVersionPopover } from './LocalVersionPopover'
import MergeRequestButton from './MergeRequestButton'
import { NotificationsPopoverV2 } from './NotificationsPopoverV2/NotificationsPopover'

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
  headerTitle?: string
  showProductMenu?: boolean
}

const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  headerTitle,
  showProductMenu,
}: LayoutHeaderProps) => {
  const { ref: projectRef, slug } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { setMobileMenuOpen } = useAppStateSnapshot()
  const gitlessBranching = useIsBranching2Enabled()

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: selectedOrganization?.usage_billing_enabled === false }
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
      {showProductMenu && (
        <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
          <button
            title="Menu dropdown button"
            className={cn(
              'group/view-toggle ml-4 flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
            )}
            onClick={() => setMobileMenuOpen(true)}
          >
            <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
            <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
          </button>
        </div>
      )}
      <div
        className={cn(
          'flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4'
        )}
      >
        <div className="flex items-center text-sm">
          <HomeIcon />
          <div className="flex items-center md:pl-2">
            {showOrgSelection && IS_PLATFORM ? (
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
                        <Badge variant="destructive" className="whitespace-nowrap">
                          Exceeding usage limits
                        </Badge>
                      </Link>
                    </div>
                  )}

                  {selectedProject && (
                    <>
                      <LayoutHeaderDivider />
                      {IS_PLATFORM && <BranchDropdown />}
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
                className="ml-3 items-center gap-x-2 flex"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                {IS_PLATFORM && gitlessBranching && <MergeRequestButton />}
                <Connect />
              </motion.div>
            )}
          </AnimatePresence>
          <BreadcrumbsView defaultValue={breadcrumbs} />
        </div>
        <div className="flex items-center gap-x-2">
          {customHeaderComponents && customHeaderComponents}
          {IS_PLATFORM ? (
            <>
              <FeedbackDropdown />

              <div className="overflow-hidden flex items-center rounded-full border">
                <HelpPopover />
                <NotificationsPopoverV2 />
                <AnimatePresence initial={false}>
                  {!!projectRef && (
                    <>
                      <InlineEditorButton />
                      <AssistantButton />
                    </>
                  )}
                </AnimatePresence>
              </div>
              <UserDropdown />
            </>
          ) : (
            <>
              <LocalVersionPopover />
              <div className="overflow-hidden flex items-center rounded-full border">
                <AnimatePresence initial={false}>
                  {!!projectRef && (
                    <>
                      <InlineEditorButton />
                      <AssistantButton />
                    </>
                  )}
                </AnimatePresence>
              </div>
              <LocalDropdown />
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default LayoutHeader
