import { useParams } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useLocalStorage, useSelectedOrganization } from 'hooks'
import AppLayout from '../AppLayout/AppLayout'
import AccountSettingsMenu from './AccountSettingsMenu'
import OrganizationSettingsMenu from './OrganizationSettingsMenu'

import { SidebarSection } from '../AccountLayout/AccountLayout.types'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { SectionWithHeaders } from '../AccountLayout/WithSidebar'
import { useIsNavigationPreviewEnabled } from 'components/interfaces/App/FeaturePreviewContext'

const SettingsLayout = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const { ref, slug } = useParams()
  const isNavigationPreviewEnabled = useIsNavigationPreviewEnabled()

  // [Joshen] Start: Can be removed once fully migrated to navigation V2
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations } = useOrganizationsQuery()

  const organizationsLinks = (organizations ?? [])
    .map((organization) => ({
      isActive:
        router.pathname.startsWith('/org/') && selectedOrganization?.slug === organization.slug,
      label: organization.name,
      href: `/org/${organization.slug}/general`,
      key: organization.slug,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const sectionsWithHeaders: SidebarSection[] = [
    {
      heading: 'Projects',
      key: 'projects',
      links: [
        {
          isActive: router.pathname === '/projects',
          label: 'All projects',
          href: '/projects',
          key: 'all-projects-item',
        },
      ],
    },
    ...(IS_PLATFORM && organizationsLinks?.length > 0
      ? [
          {
            heading: 'Organizations',
            key: 'organizations',
            links: organizationsLinks,
          },
        ]
      : []),
    ...(IS_PLATFORM
      ? [
          {
            heading: 'Account',
            key: 'account',
            links: [
              {
                isActive: router.pathname === `/account/me`,
                icon: `${router.basePath}/img/user.svg`,
                label: 'Preferences',
                href: `/account/me`,
                key: `/account/me`,
              },
              {
                isActive: router.pathname === `/account/tokens`,
                icon: `${router.basePath}/img/user.svg`,
                label: 'Access Tokens',
                href: `/account/tokens`,
                key: `/account/tokens`,
              },
            ],
          },
        ]
      : []),
    {
      heading: 'Documentation',
      key: 'documentation',
      links: [
        {
          key: 'ext-guides',
          icon: `${router.basePath}/img/book.svg`,
          label: 'Guides',
          href: 'https://supabase.com/docs',
          isExternal: true,
        },
        {
          key: 'ext-guides',
          icon: `${router.basePath}/img/book-open.svg`,
          label: 'API Reference',
          href: 'https://supabase.com/docs/guides/api',
          isExternal: true,
        },
      ],
    },
  ]
  // [Joshen] End: Can be removed once fully migrated to navigation V2

  return (
    <AppLayout>
      <div className="flex h-full">
        {!isNavigationPreviewEnabled && (
          <div className="h-full overflow-y-auto min-w-[260px] border-r">
            {sectionsWithHeaders.map((section) => (
              <SectionWithHeaders key={section.key} section={section} />
            ))}
          </div>
        )}
        {isNavigationPreviewEnabled && router.pathname !== '/projects' && (
          <div className="h-full overflow-y-auto min-w-[280px] border-r px-8 py-8">
            {slug === undefined && ref === undefined ? (
              <AccountSettingsMenu />
            ) : (
              <OrganizationSettingsMenu />
            )}
          </div>
        )}
        <div className="h-full overflow-y-auto flex-grow">{children}</div>
      </div>
    </AppLayout>
  )
}

export default SettingsLayout
