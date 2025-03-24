import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSendResetMutation } from 'data/telemetry/send-reset-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn, NavMenu, NavMenuItem } from 'ui'
import {
  MAX_WIDTH_CLASSES,
  PADDING_CLASSES,
  ScaffoldContainerLegacy,
  ScaffoldTitle,
} from '../Scaffold'
import { useNewLayout } from 'hooks/ui/useNewLayout'

export interface AccountLayoutProps {
  title: string
  breadcrumbs: {
    key: string
    label: string
  }[]
}

const AccountLayout = ({ children, title, breadcrumbs }: PropsWithChildren<AccountLayoutProps>) => {
  const newLayoutPreview = useNewLayout()

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

  const accountLinks = [
    {
      label: 'Account Settings',
      href: `/account/me`,
      keys: [`/account/me`, `/account/tokens`, `/account/security`],
    },
    {
      label: 'Audit Logs',
      href: `/account/audit`,
      key: `/account/audit`,
    },
  ]

  const currentPath = router.pathname

  if (!newLayoutPreview) {
    return children
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <div className="flex flex-col h-screen w-screen">
        <ScaffoldContainerLegacy>
          <Link
            href={`/org/${selectedOrganization?.slug}`}
            className="flex text-xs flex-row gap-2 items-center text-foreground-lighter focus-visible:text-foreground hover:text-foreground"
          >
            <ArrowLeft strokeWidth={1.5} size={14} />
            Back to dashboard
          </Link>
          <ScaffoldTitle>Account settings</ScaffoldTitle>
        </ScaffoldContainerLegacy>
        <div className="border-b">
          <NavMenu
            className={cn(PADDING_CLASSES, MAX_WIDTH_CLASSES, 'border-none')}
            aria-label="Organization menu navigation"
          >
            {accountLinks.map((item, i) => (
              <NavMenuItem
                key={`${item.key}-${i}`}
                active={(item.key === currentPath || item.keys?.includes(currentPath)) ?? false}
              >
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </div>
        {children}
      </div>
    </>
  )
}

export default withAuth(AccountLayout)
