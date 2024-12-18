import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import PartnerIcon from 'components/ui/PartnerIcon'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import type { SidebarSection } from './AccountLayout.types'
import WithSidebar from './WithSidebar'
import { Button } from 'ui'
import Link from 'next/link'

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

  const links = [
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
  ]

  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <div className="flex flex-col h-screen w-screen">
        <div className="flex flex-row min-w-5xl max-w-5xl mx-auto py-20">
          <nav className="py-5">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.key}>
                  <Link href={link.href}>
                    <Button type={link.isActive ? 'default' : 'text'} className="border-0">
                      {link.label}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex-1 flex-grow">{children}</div>
        </div>
      </div>
    </>
  )
}

export default withAuth(AccountLayout)
