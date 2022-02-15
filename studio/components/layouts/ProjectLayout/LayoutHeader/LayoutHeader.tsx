import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { IconChevronRight, Typography } from '@supabase/ui'

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
    <div className={`p-2 max-h-12 h-12 ${headerBorder ? 'border-b dark:border-dark' : ''}`}>
      <div className="PageHeader">
        <div className="Breadcrumbs flex justify-between">
          <div className="text-sm flex items-center">
            {/* Organization is selected */}
            {selectedOrganization ? (
              <>
                {/* Org Dropdown */}
                <OrgDropdown />

                {/* Project is selected */}
                {selectedProject && (
                  <>
                    <Typography.Text className="mx-2 ">
                      <IconChevronRight size="tiny" strokeWidth={1} />
                    </Typography.Text>
                    {/* Project Dropdown */}
                    <ProjectDropdown />
                  </>
                )}
              </>
            ) : (
              <Typography.Text small className="mx-2">
                <Link href="/">
                  <a
                    className={`block px-2 py-1 focus:outline-none focus:bg-transparent cursor-pointer dark:hover:text-white`}
                  >
                    Supabase
                  </a>
                </Link>
              </Typography.Text>
            )}
            {/* Additional breadcrumbs are supplied */}
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex space-x-1 md:space-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM && <HelpPopover />}
            {IS_PLATFORM && <FeedbackDropdown />}
          </div>
        </div>
      </div>
    </div>
  )
}
export default observer(LayoutHeader)
