import { observer } from 'mobx-react-lite'
import Link from 'next/link'

import { IS_PLATFORM } from 'lib/constants'
import { useStore } from 'hooks'
import BreadcrumbsView from './BreadcrumbsView'
import OrgDropdown from './OrgDropdown'
import ProjectDropdown from './ProjectDropdown'
import FeedbackDropdown from './FeedbackDropdown'
import HelpPopover from './HelpPopover'

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ui } = useStore()
  const { selectedOrganization, selectedProject } = ui

  return (
    <div
      className={`py-2 px-5 max-h-12 h-12 flex justify-between ${
        headerBorder ? 'border-b dark:border-dark' : ''
      }`}
    >
      {/* <div className="PageHeader"> */}
      {/* <div className="flex justify-between"> */}
      <div className="text-sm flex items-center -ml-2">
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
              </>
            )}
          </>
        ) : (
          <Link href="/">
            <a
              className={`text-xs text-scale-1200 px-2 py-1 focus:outline-none focus:bg-transparent cursor-pointer`}
            >
              Supabase
            </a>
          </Link>
        )}
        {/* Additional breadcrumbs are supplied */}
        <BreadcrumbsView defaultValue={breadcrumbs} />
      </div>
      <div className="flex space-x-2">
        {customHeaderComponents && customHeaderComponents}
        {IS_PLATFORM && <HelpPopover />}
        {IS_PLATFORM && <FeedbackDropdown />}
      </div>
    </div>
    // </div>
    // </div>
  )
}
export default observer(LayoutHeader)
