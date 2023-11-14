import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useFlag, useSelectedOrganization, withAuth } from 'hooks'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import SettingsLayout from '../SettingsLayout/SettingsLayout'
import { SidebarSection } from './AccountLayout.types'
import WithSidebar from './WithSidebar'

export interface AccountLayoutProps {
  title: string
  breadcrumbs: {
    key: string
    label: string
  }[]
}

const AccountLayout = ({ children, title, breadcrumbs }: PropsWithChildren<AccountLayoutProps>) => {
  const router = useRouter()
  const { data: organizations } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()

  const ongoingIncident = useFlag('ongoingIncident')
  const navLayoutV2 = useFlag('navigationLayoutV2')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  const signOut = useSignOut()
  const onClickLogout = async () => {
    await signOut()
    await router.push('/sign-in')
  }

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

              {
                isActive: router.pathname === `/account/security`,
                icon: `${router.basePath}/img/user.svg`,
                label: 'Security',
                href: `/account/security`,
                key: `/account/security`,
              },
              {
                isActive: router.pathname === `/account/audit`,
                icon: `${router.basePath}/img/user.svg`,
                label: 'Audit Logs',
                href: `/account/audit`,
                key: `/account/audit`,
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
    ...(IS_PLATFORM
      ? [
          {
            key: 'logout-link',
            links: [
              {
                key: `logout`,
                icon: '/icons/feather/power.svg',
                label: 'Logout',
                href: undefined,
                onClick: onClickLogout,
              },
            ],
          },
        ]
      : []),
  ]

  if (navLayoutV2) {
    return <SettingsLayout>{children}</SettingsLayout>
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <div className="flex h-full">
        <main
          style={{ height: maxHeight, maxHeight }}
          className="flex flex-col flex-1 w-full overflow-y-auto"
        >
          <WithSidebar
            hideSidebar={navLayoutV2}
            title={title}
            breadcrumbs={breadcrumbs}
            sections={sectionsWithHeaders}
          >
            {children}
          </WithSidebar>
        </main>
      </div>
    </>
  )
}

export default withAuth(AccountLayout)

export const AccountLayoutWithoutAuth = AccountLayout
