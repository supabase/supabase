import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { useParams } from 'common'
import { Badge, IconCommand, IconSearch, SearchButton, useCommandMenu } from 'ui'

import { detectOS } from 'lib/helpers'
import { IS_PLATFORM, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { useFlag, useStore } from 'hooks'
import BreadcrumbsView from './BreadcrumbsView'
import OrgDropdown from './OrgDropdown'
import ProjectDropdown from './ProjectDropdown'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopover from './NotificationsPopover'
import { getResourcesExceededLimits } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { useProjectReadOnlyQuery } from 'data/config/project-read-only-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ui } = useStore()
  const { selectedOrganization, selectedProject } = ui

  const os = detectOS()
  const { setIsOpen } = useCommandMenu()
  const showCmdkHelper = useFlag('dashboardCmdk')

  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()
  const { data: isReadOnlyMode } = useProjectReadOnlyQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: usage } = useProjectUsageQuery({ projectRef })
  const resourcesExceededLimits = getResourcesExceededLimits(usage)

  const projectHasNoLimits =
    ui.selectedProject?.subscription_tier === PRICING_TIER_PRODUCT_IDS.PAYG ||
    ui.selectedProject?.subscription_tier === PRICING_TIER_PRODUCT_IDS.ENTERPRISE ||
    ui.selectedProject?.subscription_tier === PRICING_TIER_PRODUCT_IDS.TEAM

  const showOverUsageBadge =
    useFlag('overusageBadge') &&
    selectedProject?.subscription_tier !== undefined &&
    !projectHasNoLimits &&
    resourcesExceededLimits.length > 0

  return (
    <div
      className={`flex h-12 max-h-12 items-center justify-between py-2 px-5 ${
        headerBorder ? 'border-b dark:border-dark' : ''
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
      {IS_PLATFORM && showCmdkHelper && (
        <SearchButton className="lg:w-full max-w-sm lg:max-w-md">
          <div
            className="
              flex
              group
              items-center
              justify-between
              bg-scaleA-200
              border
              transition
              hover:border-scale-600
              hover:bg-scaleA-300
              border-scale-500 pl-3 pr-1.5 w-full h-[32px] rounded"
          >
            <div className="flex items-center space-x-2">
              <IconSearch className="text-scale-1100" size={18} strokeWidth={2} />
              <p className="text-scale-1100 text-sm group-hover:text-scale-1200 transition">
                Search...
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <div className="text-scale-1200 md:flex items-center justify-center h-5 w-10 border rounded bg-scale-500 border-scale-700 gap-1">
                <IconCommand size={12} strokeWidth={1.5} />
                <span className="text-[12px]">K</span>
              </div>
            </div>
          </div>
        </SearchButton>
      )}
      <div className="flex items-center space-x-2">
        {customHeaderComponents && customHeaderComponents}
        {IS_PLATFORM && <HelpPopover />}
        {IS_PLATFORM && <FeedbackDropdown />}
        {IS_PLATFORM && <NotificationsPopover />}
      </div>
    </div>
  )
}
export default observer(LayoutHeader)
