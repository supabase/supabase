import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'

import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { Badge } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopoverV2 from './NotificationsPopoverV2/NotificationsPopover'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true

  const { data: orgUsage } = useOrgUsageQuery({ orgSlug: selectedOrganization?.slug })

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganization?.slug,
  })

  const projectHasNoLimits = subscription?.usage_billing_enabled === true

  const showOverUsageBadge =
    (subscription?.plan.id === 'free' || subscription?.plan.id === 'pro') &&
    !projectHasNoLimits &&
    exceedingLimits

  return (
    <div
      className={`flex h-12 max-h-12 items-center justify-between py-2 px-5 bg-dash-sidebar ${
        headerBorder ? 'border-b border-default' : ''
      }`}
    >
      <div className="-ml-2 flex items-center text-sm">
        {/* Organization is selected */}
        {projectRef && (
          <>
            <OrganizationDropdown />

            {projectRef && (
              <>
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
                    <path d="M16 3.549L7.12 20.600"></path>
                  </svg>
                </span>

                <ProjectDropdown />

                {showOverUsageBadge && (
                  <div className="ml-2">
                    <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                      <Badge variant="destructive">Exceeding usage limits</Badge>
                    </Link>
                  </div>
                )}
              </>
            )}

            {selectedProject && (
              <>
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
                    <path d="M16 3.549L7.12 20.600"></path>
                  </svg>
                </span>
                {isBranchingEnabled ? <BranchDropdown /> : <EnableBranchingButton />}
              </>
            )}
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
  )
}
export default LayoutHeader
