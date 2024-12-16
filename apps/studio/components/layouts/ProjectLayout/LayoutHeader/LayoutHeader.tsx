import Link from 'next/link'
import { ReactNode, useMemo } from 'react'

import Connect from 'components/interfaces/Connect/Connect'
import { useParams } from 'common'
import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { Badge, cn } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopoverV2 from './NotificationsPopoverV2/NotificationsPopover'

const LayoutHeaderDivider = () => (
  <span className="text-border-stronger">
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
  headerBorder?: boolean
  showProductMenu?: boolean
  customSidebarContent?: ReactNode
  handleMobileMenu: Function
}

const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  headerBorder = true,
  showProductMenu,
  handleMobileMenu,
}: LayoutHeaderProps) => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  const connectDialogUpdate = useFlag('connectDialogUpdate')

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

  return (
    <div
      className={cn(
        'flex h-12 max-h-12 min-h-12 items-center bg-dash-sidebar',
        headerBorder ? 'border-b border-default' : ''
      )}
    >
      {showProductMenu && (
        <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
          <button
            title="Menu dropdown button"
            className={cn(
              'group/view-toggle ml-4 flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
            )}
            onClick={() => handleMobileMenu()}
          >
            <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
            <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
          </button>
        </div>
      )}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex w-full items-center justify-between py-2 pl-1 pr-3 md:px-3 flex-nowrap overflow-x-scroll">
          <div className="flex items-center text-sm">
            {projectRef && (
              <>
                <div className="flex items-center">
                  <OrganizationDropdown />
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
                </div>

                <div className="ml-3 flex items-center gap-x-3">
                  {connectDialogUpdate && <Connect />}
                  {!isBranchingEnabled && <EnableBranchingButton />}
                </div>
              </>
            )}

            {/* Additional breadcrumbs are supplied */}
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex items-center gap-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM && (
              <>
                <FeedbackDropdown />
                <NotificationsPopoverV2 />
                <HelpPopover />
              </>
            )}
          </div>
        </div>
        <div className="absolute md:hidden left-0 h-full w-3 bg-gradient-to-r from-background-dash-sidebar to-transparent pointer-events-none" />
        <div className="absolute md:hidden right-0 h-full w-3 bg-gradient-to-l from-background-dash-sidebar to-transparent pointer-events-none" />
      </div>
      {!!projectRef && (
        <div className="border-l flex-0 h-full">
          <AssistantButton />
        </div>
      )}
    </div>
  )
}
export default LayoutHeader
