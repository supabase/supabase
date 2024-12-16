import Link from 'next/link'
import { useMemo } from 'react'

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

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
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
      <div className="flex items-center justify-between py-2 px-3 flex-1">
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
      {!!projectRef && (
        <div className="border-l flex-0 h-full">
          <AssistantButton />
        </div>
      )}
    </div>
  )
}
export default LayoutHeader
