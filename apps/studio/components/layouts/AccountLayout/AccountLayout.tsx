import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import PartnerIcon from 'components/ui/PartnerIcon'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { useFlag } from 'hooks/ui/useFlag'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import SettingsLayout from '../SettingsLayout/SettingsLayout'
import type { SidebarSection } from './AccountLayout.types'
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

  const navLayoutV2 = useFlag('navigationLayoutV2')
  const { mutateAsync: sendReset } = useSendResetMutation()

  const signOut = useSignOut()
  const onClickLogout = async () => {
    await sendReset()
    await signOut()
    await router.push('/sign-in')
  }

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push('/project/default')
    }
  }, [router])

  const organizationsLinks = (organizations ?? [])
    .map((organization) => ({
      isActive:
        router.pathname.startsWith('/org/') && selectedOrganization?.slug === organization.slug,
      label: organization.name,
      href: `/org/${organization.slug}/general`,
      key: organization.slug,
      icon: <PartnerIcon organization={organization} />,
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
                label: 'Preferences',
                href: `/account/me`,
                key: `/account/me`,
              },
              {
                isActive: router.pathname === `/account/tokens`,
                label: 'Access Tokens',
                href: `/account/tokens`,
                key: `/account/tokens`,
              },

              {
                isActive: router.pathname === `/account/security`,
                label: 'Security',
                href: `/account/security`,
                key: `/account/security`,
              },
              {
                isActive: router.pathname === `/account/audit`,
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
          label: 'Guides',
          href: 'https://supabase.com/docs',
          isExternal: true,
        },
        {
          key: 'ext-guides',
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
                label: 'Log out',
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
      <div className="h-screen min-h-[0px] basis-0 flex-1">
        <WithSidebar
          hideSidebar={navLayoutV2}
          title={title}
          breadcrumbs={breadcrumbs}
          sections={sectionsWithHeaders}
        >
          {children}
        </WithSidebar>
      </div>
    </>
  )
}

export default withAuth(AccountLayout)
