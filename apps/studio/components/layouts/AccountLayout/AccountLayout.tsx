import { ArrowLeft } from 'lucide-react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { cn, NavMenu, NavMenuItem } from 'ui'
import {
  MAX_WIDTH_CLASSES,
  PADDING_CLASSES,
  ScaffoldContainerLegacy,
  ScaffoldTitle,
} from '../Scaffold'

export interface AccountLayoutProps {
  title: string
}

const AccountLayout = ({ children, title }: PropsWithChildren<AccountLayoutProps>) => {
  const router = useRouter()
  const appSnap = useAppStateSnapshot()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const backToDashboardURL =
    appSnap.lastRouteBeforeVisitingAccountPage.length > 0
      ? appSnap.lastRouteBeforeVisitingAccountPage
      : !!lastVisitedOrganization
        ? `/org/${lastVisitedOrganization}`
        : '/organizations'

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

  useEffect(() => {
    if (!IS_PLATFORM) {
      router.push('/project/default')
    }
  }, [router])

  return (
    <>
      <Head>
        <title>{title ? `${title} | Supabase` : 'Supabase'}</title>
        <meta name="description" content="Supabase Studio" />
      </Head>
      <div className={cn('flex flex-col h-screen w-screen')}>
        <ScaffoldContainerLegacy>
          <Link
            href={backToDashboardURL}
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
