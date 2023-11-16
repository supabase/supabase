import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useFlag, useSelectedOrganization, useSelectedProject } from 'hooks'
import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopover from '../ProjectLayout/LayoutHeader/NotificationsPopover'
import BranchDropdown from './BranchDropdown'
import EnableBranchingButton from './EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from './OrganizationDropdown'
import ProjectDropdown from './ProjectDropdown'
import SettingsButton from './SettingsButton'
import UserSettingsDropdown from './UserSettingsDropdown'

const AppHeader = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()
  const enableBranchManagement = useFlag('branchManagement')

  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-background border-b">
      <div className="flex items-center space-x-1">
        <Link
          href={organization !== undefined ? `/org/${organization?.slug}` : '/'}
          className="block mr-3"
        >
          <img
            src={`${router.basePath}/img/supabase-logo.svg`}
            alt="Supabase"
            className="mx-auto h-[40px] w-6 cursor-pointer rounded"
          />
        </Link>
        <OrganizationDropdown isNewNav />
        {ref !== undefined && <ProjectDropdown isNewNav />}
        {ref !== undefined && enableBranchManagement && (
          <>
            {isBranchingEnabled ? <BranchDropdown isNewNav /> : <EnableBranchingButton isNewNav />}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <FeedbackDropdown alt />
          <NotificationsPopover alt />
          <HelpPopover alt />
          <SettingsButton />
        </div>
        <div className="flex items-center gap-3">
          <UserSettingsDropdown />
        </div>
      </div>
    </div>
  )
}

export default AppHeader
