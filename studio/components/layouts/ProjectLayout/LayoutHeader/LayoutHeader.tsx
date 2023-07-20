import { useParams } from 'common'
import Link from 'next/link'
import { Badge } from 'ui'

import { getResourcesExceededLimits } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useProjectReadOnlyQuery } from 'data/config/project-read-only-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import BreadcrumbsView from './BreadcrumbsView'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopover from './NotificationsPopover'
import OrgDropdown from './OrgDropdown'
import ProjectDropdown from './ProjectDropdown'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()

  const { ref: projectRef } = useParams()
  const { data: isReadOnlyMode } = useProjectReadOnlyQuery({
    projectRef: selectedProject?.ref,
    connectionString: selectedProject?.connectionString,
  })

  // Skip with org-level-billing, as quota is for the entire org
  const { data: usage } = useProjectUsageQuery(
    { projectRef },
    { enabled: selectedOrganization && !selectedOrganization.subscription_id }
  )
  const resourcesExceededLimits = getResourcesExceededLimits(usage)

  // Skip with org-level-billing, as quota is for the entire org
  const { data: subscription } = useProjectSubscriptionV2Query(
    { projectRef },
    { enabled: selectedOrganization && !selectedOrganization.subscription_id }
  )

  const projectHasNoLimits = subscription?.usage_billing_enabled === false

  const showOverUsageBadge =
    useFlag('overusageBadge') &&
    subscription !== undefined &&
    !projectHasNoLimits &&
    resourcesExceededLimits.length > 0

  return (
    <div
      className={`flex h-12 max-h-12 items-center justify-between py-2 px-5 ${
        headerBorder ? 'border-b border-scale-500' : ''
      }`}
    >
      <div className="-ml-2 flex items-center text-sm">
        {/* Organization is selected */}
        {projectRef && selectedOrganization ? (
          <>
            {/* Org Dropdown */}
            <OrgDropdown />

            {/* Project is selected */}
            {selectedProject && (
              <>
                <span className="text-scale-800 dark:text-scale-700">
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
                {/* Project Dropdown */}
                <ProjectDropdown />

                {/* [Terry] Temporary until we figure out how we want to display this permanently */}
                {/* context: https://www.notion.so/supabase/DB-Disk-Size-Free-tier-Read-only-Critical-f2b8937c13a149e3ac769fe5888f6db0*/}
                {isReadOnlyMode && (
                  <div className="ml-2">
                    <Link href={`/project/${projectRef}/settings/billing/usage`}>
                      <a>
                        <Badge color="red">Project is in read-only mode</Badge>
                      </a>
                    </Link>
                  </div>
                )}

                {showOverUsageBadge && (
                  <div className="ml-2">
                    <Link href={`/project/${projectRef}/settings/billing/usage`}>
                      <a>
                        <Badge color="red">Exceeding usage limits</Badge>
                      </a>
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <Link href="/projects">
            <a
              className={`cursor-pointer px-2 py-1 text-xs text-scale-1200 focus:bg-transparent focus:outline-none`}
            >
              Supabase
            </a>
          </Link>
        )}
        {/* Additional breadcrumbs are supplied */}
        <BreadcrumbsView defaultValue={breadcrumbs} />
      </div>
      <div className="flex items-center space-x-2">
        {customHeaderComponents && customHeaderComponents}
        {IS_PLATFORM && <HelpPopover />}
        {IS_PLATFORM && <FeedbackDropdown />}
        {IS_PLATFORM && <NotificationsPopover />}
      </div>
    </div>
  )
}
export default LayoutHeader
