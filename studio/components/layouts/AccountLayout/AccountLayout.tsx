import Head from 'next/head'
import { FC, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { IS_PLATFORM } from 'lib/constants'
import { useStore, withAuth, useFlag } from 'hooks'
import WithSidebar from './WithSidebar'
import { auth } from 'lib/gotrue'

// Layout for dashboard homepage, account and org settings

interface Props {
  title: string
  breadcrumbs: Object[]
  children: ReactNode
}

const AccountLayout: FC<Props> = ({ children, title, breadcrumbs }) => {
  const router = useRouter()
  const { app, ui } = useStore()

  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  const onClickLogout = async () => {
    await auth.signOut()
    router.reload()
  }

  const organizationsLinks = app.organizations
    .list()
    .map((x: any) => ({
      key: `${x.slug}-settings`,
      href: `/org/${x.slug}/settings`,
      label: x.name,
      isActive: router.pathname.startsWith('/org/') && ui.selectedOrganization?.slug === x.slug,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const sidebarLinks = [
    {
      heading: 'Projects',
      links: [
        {
          key: 'all-projects',
          href: '/',
          label: 'All projects',
          isActive: router.pathname === '/',
        },
      ],
    },
    ...(IS_PLATFORM && organizationsLinks.length > 0
      ? [
          {
            heading: 'Organizations',
            links: organizationsLinks,
          },
        ]
      : []),
    ...(IS_PLATFORM
      ? [
          {
            heading: 'Account',
            links: [
              {
                key: 'account-me',
                href: '/account/me',
                icon: '/img/user.svg',
                label: 'Preferences',
                isActive: router.pathname === '/account/me',
              },
              {
                key: 'account-tokens',
                href: '/account/tokens',
                icon: '/img/user.svg',
                label: 'Access Tokens',
                isActive: router.pathname === '/account/tokens',
              },
            ],
          },
        ]
      : []),
    {
      heading: 'Documentation',
      links: [
        {
          key: 'ext-guides',
          href: 'https://supabase.com/docs',
          icon: '/img/book.svg',
          label: 'Guides',
          isExternal: true,
        },
        {
          key: 'ext-guides',
          href: 'https://supabase.com/docs/guides/api',
          icon: '/img/book-open.svg',
          label: 'API Reference',
          isExternal: true,
        },
      ],
    },
    {
      heading: '',
      links: [
        {
          key: 'logout',
          icon: '/icons/feather/power.svg',
          label: 'Logout',
          onClick: onClickLogout,
        },
      ],
    },
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
          className="flex w-full flex-1 flex-col overflow-y-auto"
        >
          <WithSidebar title={title} breadcrumbs={breadcrumbs} links={sidebarLinks}>
            {children}
          </WithSidebar>
        </main>
      </div>
    </>
  )
}

export default withAuth(observer(AccountLayout))

export const AccountLayoutWithoutAuth = observer(AccountLayout)
