import Head from 'next/head'
import { FC, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { auth, STORAGE_KEY } from 'lib/gotrue'
import { useStore, withAuth, useFlag } from 'hooks'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import WithSidebar from './WithSidebar'
import { SidebarSection } from './AccountLayout.types'

interface Props {
  title: string
  breadcrumbs: {
    key: string
    label: string
  }[]
  children: ReactNode
}

const AccountLayout: FC<Props> = ({ children, title, breadcrumbs }) => {
  const router = useRouter()
  const { app, ui } = useStore()

  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  const onClickLogout = async () => {
    await auth.signOut()
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/sign-in'
  }

  const organizationsLinks = app.organizations
    .list()
    .map((organization) => ({
      isActive:
        router.pathname.startsWith('/org/') && ui.selectedOrganization?.slug === organization.slug,
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
                icon: '/img/user.svg',
                label: 'Preferences',
                href: `/account/me`,
                key: `/account/me`,
              },
              {
                isActive: router.pathname === `/account/tokens`,
                icon: '/img/user.svg',
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
          icon: '/img/book.svg',
          label: 'Guides',
          href: 'https://supabase.com/docs',
          isExternal: true,
        },
        {
          key: 'ext-guides',
          icon: '/img/book-open.svg',
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

  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full">
        <main
          style={{ height: maxHeight, maxHeight }}
          className="flex flex-col flex-1 w-full overflow-y-auto"
        >
          <WithSidebar title={title} breadcrumbs={breadcrumbs} sections={sectionsWithHeaders}>
            {children}
          </WithSidebar>
        </main>
      </div>
    </>
  )
}

export default withAuth(observer(AccountLayout))

export const AccountLayoutWithoutAuth = observer(AccountLayout)
