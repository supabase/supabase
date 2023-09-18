import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'
import { Badge } from 'ui'

import {
  getResourcesExceededLimits,
  getResourcesExceededLimitsOrg,
} from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import BreadcrumbsView from './BreadcrumbsView'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopover from './NotificationsPopover'
import OrgDropdown from './OrgDropdown'
import ProjectDropdown from './ProjectDropdown'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ref: projectRef } = useParams()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()

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
