import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { useRouter } from 'next/router'
import type { PropsWithChildren } from 'react'

import { DefaultLayoutProviders } from '../DefaultLayoutProviders'
import { LayoutHeader } from './LayoutHeader'
import { RightPanelToolbarLayout } from './RightPanelToolbar'
import { AppBannerWrapper } from '@/components/interfaces/App/AppBannerWrapper'
import { Sidebar } from '@/components/interfaces/Sidebar'
import MobileNavigationBar from '@/components/layouts/Navigation/NavigationBar/MobileNavigationBar'
import { useHideSidebar } from '@/hooks/misc/useHideSidebar'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useAppStateSnapshot } from '@/state/app-state'

export interface DefaultLayoutV2Props {
  headerTitle?: string
  hideMobileMenu?: boolean
}

export const DefaultLayoutV2 = ({
  children,
  headerTitle,
  hideMobileMenu,
}: PropsWithChildren<DefaultLayoutV2Props>) => {
  const router = useRouter()
  const isMobile = useBreakpoint('md')
  const appSnap = useAppStateSnapshot()
  const hideSidebar = useHideSidebar()
  const showLeftSidebar = !isMobile && !hideSidebar && !router.pathname.startsWith('/organizations')

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const backToDashboardURL = router.pathname.startsWith('/account')
    ? appSnap.lastRouteBeforeVisitingAccountPage.length > 0
      ? appSnap.lastRouteBeforeVisitingAccountPage
      : lastVisitedOrganization
        ? `/org/${lastVisitedOrganization}`
        : '/organizations'
    : undefined

  return (
    <DefaultLayoutProviders>
      <div className="flex h-screen w-screen flex-col">
        <AppBannerWrapper />
        <div className="shrink-0">
          <MobileNavigationBar
            hideMobileMenu={hideMobileMenu}
            backToDashboardURL={backToDashboardURL}
          />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {showLeftSidebar && <Sidebar className="h-full min-h-0 border-r border-default" />}
          <div className="flex flex-1 h-full w-full min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="shrink-0">
              <LayoutHeader headerTitle={headerTitle} backToDashboardURL={backToDashboardURL} />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <RightPanelToolbarLayout>{children}</RightPanelToolbarLayout>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayoutProviders>
  )
}
