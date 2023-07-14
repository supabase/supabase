import Link from 'next/link'
import { useRouter } from 'next/router'
import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopover from '../ProjectLayout/LayoutHeader/NotificationsPopover'
import OrganizationDropdown from './OrganizationDropdown'
import UserSettingsDropdown from './UserSettingsDropdown'

const HeaderBar = () => {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-scale-100 shadow-md">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <a className="block">
            <img
              src={`${router.basePath}/img/supabase-logo.svg`}
              alt="Supabase"
              className="mx-auto h-[40px] w-6 cursor-pointer rounded"
            />
          </a>
        </Link>
        <OrganizationDropdown />
      </div>

      <div className="flex items-center space-x-4">
        <FeedbackDropdown />
        <NotificationsPopover alt />
        <HelpPopover alt />
        <UserSettingsDropdown />
      </div>
    </div>
  )
}

export default HeaderBar
