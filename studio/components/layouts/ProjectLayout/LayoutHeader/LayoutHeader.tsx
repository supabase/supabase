import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'

import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import {
  getResourcesExceededLimits,
  getResourcesExceededLimitsOrg,
} from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { Badge } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopover from './NotificationsPopover'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

  const enableBranchManagement = useFlag('branchManagement')

  const isBranchingEnabled =
    selectedProject?.is_branch_enabled === true || selectedProject?.parent_project_ref !== undefined

  // Skip with org-based-billing, as quota is for the entire org
  const { data: projectUsage } = useProjectUsageQuery(
    { projectRef },
    { enabled: Boolean(selectedOrganization && !selectedOrganization.subscription_id) }
  )
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: Boolean(selectedOrganization && selectedOrganization.subscription_id) }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else if (projectUsage) {
      return getResourcesExceededLimits(projectUsage).length > 0
    } else {
      return false
    }
  }, [projectUsage, orgUsage])

  // Skip with org-based-billing, as quota is for the entire org
  const { data: projectSubscription } = useProjectSubscriptionV2Query(
    { projectRef },
    { enabled: selectedOrganization && !selectedOrganization.subscription_id }
  )

  const { data: orgSubscription } = useProjectSubscriptionV2Query(
    { projectRef },
    { enabled: Boolean(selectedOrganization && selectedOrganization.subscription_id) }
  )

  const subscription = useMemo(() => {
    return projectSubscription || orgSubscription
  }, [projectSubscription, orgSubscription])

  const projectHasNoLimits = subscription?.usage_billing_enabled === true

  const showOverUsageBadge =
    useFlag('overusageBadge') &&
    subscription !== undefined &&
    (subscription.plan.id === 'free' || subscription.plan.id === 'pro') &&
    !projectHasNoLimits &&
    exceedingLimits

  return (
    <div
      className={`flex h-12 max-h-12 items-center justify-between py-2 px-5 ${
        headerBorder ? 'border-b border-scale-500' : ''
      }`}
    >
      <div className="-ml-2 flex items-center text-sm">
        {/* Organization is selected */}
        {projectRef && (
          <>
            <OrganizationDropdown />

            {projectRef && (
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

                <ProjectDropdown />

                {showOverUsageBadge && (
                  <div className="ml-2">
                    <Link
                      href={
                        selectedOrganization?.subscription_id
                          ? `/org/${selectedOrganization.slug}/usage`
                          : `/project/${projectRef}/settings/billing/usage`
                      }
                    >
                      <a>
                        <Badge color="red">Exceeding usage limits</Badge>
                      </a>
                    </Link>
                  </div>
                )}
              </>
            )}

            {selectedProject && enableBranchManagement && (
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
                {isBranchingEnabled ? <BranchDropdown /> : <EnableBranchingButton />}
              </>
            )}
          </>
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
