import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useRef } from 'react'

import { ProjectLayout } from '../ProjectLayout'
import ObservabilityMenu from './ObservabilityMenu'
import { useIndexAdvisorStatus } from '@/components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { BannerIndexAdvisor } from '@/components/ui/BannerStack/Banners/BannerIndexAdvisor'
import { FeatureMarketplaceItemBanner } from '@/components/ui/BannerStack/Banners/FeatureMarketplaceItemBanner'
import { BANNER_ID, useBannerStack } from '@/components/ui/BannerStack/BannerStackProvider'
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

  const [isFeaturedMarketplaceItemBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.FEATURED_MARKETPLACE_ITEM_BANNER_DISMISSED(ref ?? '', 'observability'),
    false
  )

  const [isIndexAdvisorBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INDEX_ADVISOR_NOTICE_DISMISSED(ref ?? ''),
    false
  )

  useEffect(() => {
    if (!isFeaturedMarketplaceItemBannerDismissed && IS_PLATFORM) {
      addBanner({
        id: BANNER_ID.FEATURED_MARKETPLACE_ITEM,
        isDismissed: false,
        content: <FeatureMarketplaceItemBanner category="observability" />,
        priority: 1,
      })
    } else {
      dismissBanner(BANNER_ID.FEATURED_MARKETPLACE_ITEM)
    }
  }, [isFeaturedMarketplaceItemBannerDismissed, addBanner, dismissBanner])

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
