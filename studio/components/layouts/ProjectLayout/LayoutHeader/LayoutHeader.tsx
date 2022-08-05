import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { IS_PLATFORM } from 'lib/constants'
import { useStore, useProjectUsageStatus } from 'hooks'
import BreadcrumbsView from './BreadcrumbsView'
import OrgDropdown from './OrgDropdown'
import ProjectDropdown from './ProjectDropdown'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopover from './NotificationsPopover'
import { Badge } from '@supabase/ui'
import { getResourcesExceededLimits } from 'components/ui/OveragesBanner/OveragesBanner.utils'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ui } = useStore()
  const { selectedOrganization, selectedProject } = ui

  const router = useRouter()
  const { ref } = router.query
  // const { usageStatus } = useProjectUsageStatus(ref as string)

  // [Joshen TODO] After API is ready, to do up proper logic here
  const usage: any = {
    dbSize: { value: 10773283, limit: 524288000 },
    dbEgress: { value: 400000000, limit: 524288000 },
    storageSize: { value: 624288000, limit: 524288000 },
    storageEgress: { value: 0, limit: 524288000 },
  }
  const resourcesExceededLimits = getResourcesExceededLimits(usage)
  const isOverUsageLimits = resourcesExceededLimits.length > 0

  return (
    <div
      className={`flex h-12 max-h-12 items-center justify-between py-2 px-5 ${
        headerBorder ? 'dark:border-dark border-b' : ''
      }`}
    >
      <div className="-ml-2 flex items-center text-sm">
        {/* Organization is selected */}
        {selectedOrganization ? (
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
                {isOverUsageLimits && (
                  <div className="ml-2">
                    <Link href={`/project/${ref}/settings/billing`}>
                      <a>
                        <Badge color="red">Project has exceeded usage limits </Badge>
                      </a>
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <Link href="/">
            <a
              className={`text-scale-1200 cursor-pointer px-2 py-1 text-xs focus:bg-transparent focus:outline-none`}
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
export default observer(LayoutHeader)
