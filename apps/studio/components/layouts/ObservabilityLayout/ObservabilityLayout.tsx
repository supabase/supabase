import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { BannerIndexAdvisor } from 'components/ui/BannerStack/Banners/BannerIndexAdvisor'
import { BannerMetricsAPI } from 'components/ui/BannerStack/Banners/BannerMetricsAPI'
import { useBannerStack } from 'components/ui/BannerStack/BannerStackProvider'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { withAuth } from 'hooks/misc/withAuth'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import ObservabilityMenu from './ObservabilityMenu'

interface ObservabilityLayoutProps {
  title?: string
}

const OBSERVABILITY_SECTION_TITLE_BY_ROUTE: Record<string, string> = {
  'api-overview': 'API Gateway',
  auth: 'Auth',
  database: 'Database',
  'edge-functions': 'Edge Functions',
  postgrest: 'PostgREST',
  'query-performance': 'Query Performance',
  realtime: 'Realtime',
  storage: 'Storage',
}

const getObservabilitySectionTitle = (pathname: string | null, title?: string) => {
  if (title !== undefined) return title
  if (!pathname) return undefined

  const segments = pathname.split('/').filter(Boolean)
  const page = segments[3]

  if (page === undefined) return 'Overview'

  return OBSERVABILITY_SECTION_TITLE_BY_ROUTE[page] ?? 'Report'
}

const ObservabilityLayoutContent = ({
  title,
  children,
}: PropsWithChildren<ObservabilityLayoutProps>) => {
  const { ref } = useParams()
  const pathname = usePathname()
  const { addBanner, dismissBanner } = useBannerStack()
  const { isIndexAdvisorAvailable, isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [isMetricsBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.OBSERVABILITY_BANNER_DISMISSED(ref ?? ''),
    false
  )

  const [isIndexAdvisorBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INDEX_ADVISOR_NOTICE_DISMISSED(ref ?? ''),
    false
  )

  useEffect(() => {
    if (!isMetricsBannerDismissed && IS_PLATFORM) {
      addBanner({
        id: 'metrics-api-banner',
        isDismissed: false,
        content: <BannerMetricsAPI />,
        priority: 1,
      })
    } else {
      dismissBanner('metrics-api-banner')
    }
  }, [isMetricsBannerDismissed, addBanner, dismissBanner])

  const prevPathnameRef = useRef(pathname)

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
  const resolvedTitle = getObservabilitySectionTitle(pathname, title)

  if (reportsAll) {
    return (
      <ProjectLayout
        title={resolvedTitle}
        product="Observability"
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
