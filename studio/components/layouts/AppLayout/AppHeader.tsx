import Link from 'next/link'
import { useRouter } from 'next/router'
import { IconGitHub, Tabs } from 'ui'

import { useParams } from 'common'
import { useFlag, useSelectedOrganization } from 'hooks'
import FeedbackDropdown from '../ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from '../ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopover from '../ProjectLayout/LayoutHeader/NotificationsPopover'
import { ORGANIZATION_PAGES, PROJECT_PAGES } from './AppLayout.constants'
import BranchDropdown from './BranchDropdown'
import OrganizationDropdown from './OrganizationDropdown'
import ProjectDropdown from './ProjectDropdown'
import SettingsButton from './SettingsButton'
import UserSettingsDropdown from './UserSettingsDropdown'

const AppHeader = () => {
  const router = useRouter()
  const { slug, ref } = useParams()
  const activeRoute = router.pathname.split('/')[3]
  const organization = useSelectedOrganization()
  const enableBranchManagement = useFlag('branchManagement')

  return (
    <>
      <div className="px-8 py-1 bg-scale-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={organization !== undefined ? `/org/${organization?.slug}` : '/'}>
              <a className="block">
                <img
                  alt="Supabase"
                  src={`${router.basePath}/img/supabase-logo.svg`}
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
      </div>

      {slug !== undefined && (
        <Tabs
          size="medium"
          type="underlined"
          activeId={activeRoute}
          listClassNames="border-b-0"
          className="!space-y-0 border-b border-scale-400 px-4"
          onChange={(key: string) => {
            const href =
              ORGANIZATION_PAGES.find((page) => page.key === key)?.url.replace('[slug]', slug) ??
              '/'
            router.push(href)
          }}
        >
          {ORGANIZATION_PAGES.map((page) => (
            <Tabs.Panel key={page.key} id={page.key} label={page.name} />
          ))}
        </Tabs>
      )}

      {/* [Joshen] If possible to wrap <Link> around Tabs.Panel */}
      {ref !== undefined && (
        <Tabs
          size="medium"
          type="underlined"
          activeId={activeRoute}
          listClassNames="border-b-0"
          className="!space-y-0 border-b border-scale-400 px-4"
          onChange={(key: string) => {
            const href =
              PROJECT_PAGES.find((page) => page.key === key)?.url.replace('[ref]', ref) ?? '/'
            router.push(href)
          }}
        >
          {PROJECT_PAGES.map((page) => (
            <Tabs.Panel key={page.key} id={page.key} label={page.name} icon={page.icon} />
          ))}
        </Tabs>
      )}
    </>
  )
}

export default AppHeader
