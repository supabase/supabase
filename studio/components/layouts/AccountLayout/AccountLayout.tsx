import Head from 'next/head'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import WithSidebar from './WithSidebar'
import { auth } from 'lib/gotrue'

/**
 * layout for dashboard homepage, account and org settings
 *
 * @param {String}                      title
 * @param {JSX.Element|JSX.Element[]}   children
 * @param {Array<Object>}               breadcrumbs
 */

const AccountLayout = ({ children, title, breadcrumbs }: any) => {
  const router = useRouter()

  const { app, ui } = useStore()

  const onClickLogout = async () => {
    await auth.signOut()
    router.reload()
  }

  const baseLogoutLink = {
    icon: '/icons/feather/power.svg',
    label: 'Logout',
    href: `${API_URL}/logout`,
    key: `${API_URL}/logout`,
  }

  const logoutLink = { ...baseLogoutLink, href: undefined, onClick: onClickLogout }

  const organizationsLinks = app.organizations
    .list()
    .map((x: any) => ({
      isActive: router.pathname.startsWith('/org/') && ui.selectedOrganization?.slug == x.slug,
      label: x.name,
      href: `/org/${x.slug}/settings`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  let linksWithHeaders = [
    {
      heading: 'Projects',
      links: [
        {
          isActive: router.pathname == '/',
          label: 'All projects',
          href: '/',
        },
      ],
    },
    ...(IS_PLATFORM
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
                isActive: router.pathname == `/account/me`,
                icon: '/img/user.svg',
                label: 'Preferences',
                href: `/account/me`,
                key: `/account/me`,
              },
              {
                isActive: router.pathname == `/account/tokens`,
                icon: '/img/user.svg',
                label: 'Access Tokens',
                href: `/account/tokens`,
                key: `/account/tokens`,
              },
              logoutLink,
            ],
          },
        ]
      : []),
    {
      heading: 'Documentation',
      links: [
        {
          key: 'ext-guides',
          icon: '/img/book.svg',
          label: 'Guides',
          href: 'https://supabase.com/docs',
          external: true,
        },
        {
          key: 'ext-guides',
          icon: '/img/book-open.svg',
          label: 'API Reference',
          href: 'https://supabase.com/docs/reference/javascript/supabase-client',
          external: true,
        },
      ],
    },
  ]
  if (!organizationsLinks?.length)
    linksWithHeaders = linksWithHeaders.filter((x: any) => x.heading != 'Organizations')
  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-full">
        <main
          style={{ maxHeight: '100vh' }}
          className="flex w-full flex-1 flex-col overflow-y-auto"
        >
          <WithSidebar title={title} breadcrumbs={breadcrumbs} links={linksWithHeaders}>
            {children}
          </WithSidebar>
        </main>
      </div>
    </>
  )
}

export default withAuth(observer(AccountLayout))

export const AccountLayoutWithoutAuth = observer(AccountLayout)
