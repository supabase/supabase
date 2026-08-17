import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import { ObservabilityMenu } from './ObservabilityMenu'
import { useIsDatabaseConnectionsEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIndexAdvisorStatus } from '@/components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { BannerDatabaseConnections } from '@/components/ui/BannerStack/Banners/BannerDatabaseConnections'
import { BannerIndexAdvisor } from '@/components/ui/BannerStack/Banners/BannerIndexAdvisor'
import { useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { withAuth } from '@/hooks/misc/withAuth'

interface ObservabilityLayoutProps {
  title: string
}

const ObservabilityLayoutContent = ({
  title,
  children,
}: PropsWithChildren<ObservabilityLayoutProps>) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const { addBanner, dismissBanner } = useBannerStack()
  const { isIndexAdvisorAvailable, isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [isIndexAdvisorBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INDEX_ADVISOR_NOTICE_DISMISSED(ref ?? ''),
    false
  )

  const { isInitialized, previouslyToggled } = useIsDatabaseConnectionsEnabled()

  const [isDatabaseConnectionsBannerDismissed, , { isSuccess: isLocalStorageReady }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.DATABASE_CONNECTIONS_BANNER_DISMISSED(ref ?? ''), false)

  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    if (
      !isInitialized ||
      !isLocalStorageReady ||
      isDatabaseConnectionsBannerDismissed ||
      previouslyToggled
    )
      return

    addBanner({
      id: 'database-connections-banner',
      priority: 2,
      isDismissed: false,
      content: <BannerDatabaseConnections />,
    })
  }, [
    addBanner,
    dismissBanner,
    isInitialized,
    isDatabaseConnectionsBannerDismissed,
    previouslyToggled,
    isLocalStorageReady,
  ])

  useEffect(() => {
    const isQueryPerformancePage = pathname?.includes('/query-performance')

    if (
      isQueryPerformancePage &&
      isIndexAdvisorAvailable &&
      !isIndexAdvisorEnabled &&
      !isIndexAdvisorBannerDismissed
    ) {
      addBanner({
        id: 'index-advisor-banner',
        isDismissed: false,
        content: <BannerIndexAdvisor />,
        priority: 3,
      })
    } else if (isIndexAdvisorBannerDismissed || !isQueryPerformancePage || isIndexAdvisorEnabled) {
      dismissBanner('index-advisor-banner')
    }

    prevPathnameRef.current = pathname
  }, [
    pathname,
    isIndexAdvisorAvailable,
    isIndexAdvisorEnabled,
    isIndexAdvisorBannerDismissed,
    addBanner,
    dismissBanner,
  ])

  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  if (reportsAll) {
    return (
      <ProjectLayout
        product="Observability"
        browserTitle={{ section: title }}
        productMenu={<ObservabilityMenu />}
        isBlocking={false}
      >
        {children}
      </ProjectLayout>
    )
  } else {
    return <UnknownInterface urlBack={`/project/${ref}`} />
  }
}

const ObservabilityLayout = (props: PropsWithChildren<ObservabilityLayoutProps>) => {
  const { ref } = useParams()
  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  if (reportsAll) {
    return <ObservabilityLayoutContent {...props} />
  } else {
    return <UnknownInterface urlBack={`/project/${ref}`} />
  }
}

export default withAuth(ObservabilityLayout)
