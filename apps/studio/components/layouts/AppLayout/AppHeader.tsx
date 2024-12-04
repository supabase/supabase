import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { FeedbackDropdown } from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopoverV2 from '../ProjectLayout/LayoutHeader/NotificationsPopoverV2/NotificationsPopover'
import BranchDropdown from './BranchDropdown'
import EnableBranchingButton from './EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from './OrganizationDropdown'
import ProjectDropdown from './ProjectDropdown'
import SettingsButton from './SettingsButton'
import UserSettingsDropdown from './UserSettingsDropdown'
import AssistantButton from './AssistantButton'

// [Joshen] Just FYI this is only for Nav V2 which is still going through design iteration
// Component is not currently in use

const AppHeader = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()
  const organization = useSelectedOrganization()

  const isBranchingEnabled =
    project?.is_branch_enabled === true || project?.parent_project_ref !== undefined

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-studio border-b">
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
        {ref !== undefined && (
          <>
            {isBranchingEnabled ? <BranchDropdown isNewNav /> : <EnableBranchingButton isNewNav />}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <FeedbackDropdown />
          <NotificationsPopoverV2 />
          <HelpPopover />
          <AssistantButton />
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
