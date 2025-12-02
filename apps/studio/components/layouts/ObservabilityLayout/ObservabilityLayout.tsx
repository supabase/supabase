// apps/studio/components/layouts/ObservabilityLayout/ObservabilityLayout.tsx
import { PropsWithChildren, useEffect } from 'react'
import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useBannerStack } from 'components/ui/BannerStack/BannerStackProvider'
import { BannerMetricsAPI } from 'components/ui/BannerStack/Banners/BannerMetricsAPI'
import { ProjectLayout } from '../ProjectLayout'
import ObservabilityMenu from './ObservabilityMenu'
import { BannerStackProvider } from 'components/ui/BannerStack/BannerStackProvider'
import { BannerStack } from 'components/ui/BannerStack/BannerStack'

interface ObservabilityLayoutProps {
  title?: string
}

const ObservabilityLayoutContent = ({
  title,
  children,
}: PropsWithChildren<ObservabilityLayoutProps>) => {
  const { ref } = useParams()
  const { addBanner, dismissBanner } = useBannerStack()

  const [isMetricsBannerDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.OBSERVABILITY_BANNER_DISMISSED(ref ?? ''),
    false
  )

  useEffect(() => {
    if (!isMetricsBannerDismissed) {
      addBanner({
        id: 'metrics-api-banner',
        isDismissed: false,
        content: <BannerMetricsAPI />,
        priority: 1,
      })

      return () => {
        dismissBanner('metrics-api-banner')
      }
    }
  }, [ref, isMetricsBannerDismissed, addBanner, dismissBanner])

  const { reportsAll } = useIsFeatureEnabled(['reports:all'])

  if (reportsAll) {
    return (
      <ProjectLayout
        title={title}
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
    return (
      <BannerStackProvider>
        <ObservabilityLayoutContent {...props} />
        <BannerStack />
      </BannerStackProvider>
    )
  } else {
    return <UnknownInterface urlBack={`/project/${ref}`} />
  }
}

export default withAuth(ObservabilityLayout)
