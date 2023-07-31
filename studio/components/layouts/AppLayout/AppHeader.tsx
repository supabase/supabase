import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useFlag, useSelectedOrganization } from 'hooks'
import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopover from '../ProjectLayout/LayoutHeader/NotificationsPopover'
import OrganizationDropdown from './OrganizationDropdown'
import ProjectDropdown from './ProjectDropdown'
import SettingsButton from './SettingsButton'
import UserSettingsDropdown from './UserSettingsDropdown'
import BranchDropdown from './BranchDropdown'

const AppHeader = () => {
  const router = useRouter()
  const { ref } = useParams()
  const activeRoute = router.pathname.split('/')[3]
  const organization = useSelectedOrganization()
  const enableBranchManagement = useFlag('branchManagement')

  return (
    <div className="px-8 py-1 bg-scale-200 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={organization !== undefined ? `/org/${organization?.slug}` : '/'}>
            <a className="block">
              <img
                src={`${router.basePath}/img/supabase-logo.svg`}
                alt="Supabase"
                className="mx-auto h-[40px] w-6 cursor-pointer rounded"
              />
            </a>
          </Link>
          <OrganizationDropdown />
          {ref !== undefined && <ProjectDropdown />}
          {ref !== undefined && enableBranchManagement && <BranchDropdown />}
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

      {/* [Joshen] Just hacking something together quickly */}
      {ref !== undefined && (
        <div className="flex items-center space-x-4 py-2">
          <Link passHref href={`/project/${ref}/editor`}>
            <a
              className={`text-sm ${
                activeRoute === 'editor' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Table Editor
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/sql`}>
            <a
              className={`text-sm ${activeRoute === 'sql' ? 'text-scale-1200' : 'text-scale-1000'}`}
            >
              SQL Editor
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/database/tables`}>
            <a
              className={`text-sm ${
                activeRoute === 'database' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Database
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/auth/users`}>
            <a
              className={`text-sm ${
                activeRoute === 'auth' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Authentication
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/storage/buckets`}>
            <a
              className={`text-sm ${
                activeRoute === 'storage' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Storage
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/functions`}>
            <a
              className={`text-sm ${
                activeRoute === 'functions' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Edge Functions
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/reports`}>
            <a
              className={`text-sm ${
                activeRoute === 'reports' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Reports
            </a>
          </Link>

          <Link passHref href={`/project/${ref}/logs/explorer`}>
            <a
              className={`text-sm ${
                activeRoute === 'logs' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Logs
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/api`}>
            <a
              className={`text-sm ${activeRoute === 'api' ? 'text-scale-1200' : 'text-scale-1000'}`}
            >
              API
            </a>
          </Link>
          <Link passHref href={`/project/${ref}/settings/general`}>
            <a
              className={`text-sm ${
                activeRoute === 'settings' ? 'text-scale-1200' : 'text-scale-1000'
              }`}
            >
              Settings
            </a>
          </Link>
        </div>
      )}
    </div>
  )
}

export default AppHeader
