import Head from 'next/head'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { IS_PLATFORM } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { WithSidebar } from './WithSidebar'

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
      <div className={cn('flex flex-col w-screen h-[calc(100vh-48px)]')}>
        <WithSidebar
          title=""
          breadcrumbs={[]}
          backToDashboardURL={backToDashboardURL}
          sections={[
            {
              key: 'account-settings',
              heading: 'Account Settings',
              links: [
                {
                  key: 'preferences',
                  label: 'Preferences',
                  href: '/account/me',
                  isActive: currentPath === '/account/me',
                },
                {
                  key: 'access-tokens',
                  label: 'Access Tokens',
                  href: '/account/tokens',
                  isActive: currentPath === '/account/tokens',
                },
                {
                  key: 'security',
                  label: 'Security',
                  href: '/account/security',
                  isActive: currentPath === '/account/security',
                },
              ],
            },
            {
              key: 'logs',
              heading: 'Logs',
              links: [
                {
                  key: 'audit-logs',
                  label: 'Audit Logs',
                  href: '/account/audit',
                  isActive: currentPath === '/account/audit',
                },
              ],
            },
          ]}
        >
          {children}
        </WithSidebar>
      </div>
    </>
  )
}

export default withAuth(AccountLayout)
