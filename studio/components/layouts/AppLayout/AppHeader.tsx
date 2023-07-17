import Link from 'next/link'
import { useRouter } from 'next/router'

import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopover from '../ProjectLayout/LayoutHeader/NotificationsPopover'
import OrganizationDropdown from './OrganizationDropdown'
import UserSettingsDropdown from './UserSettingsDropdown'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import ProjectDropdown from '../ProjectLayout/LayoutHeader/ProjectDropdown'

const AppHeader = () => {
  const router = useRouter()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-black shadow-md">
      <div className="flex items-center space-x-4">
        <Link href={`/org/${organization?.slug}`}>
          <a className="block">
            <img
              src={`${router.basePath}/img/supabase-logo.svg`}
              alt="Supabase"
              className="mx-auto h-[40px] w-6 cursor-pointer rounded"
            />
          </a>
        </Link>
        <OrganizationDropdown />
        <ProjectDropdown alt />
      </div>

      <div className="flex items-center space-x-4">
        <FeedbackDropdown alt />
        <NotificationsPopover alt />
        <HelpPopover alt />
        <UserSettingsDropdown />
      </div>
    </div>
  )
}

export default AppHeader
