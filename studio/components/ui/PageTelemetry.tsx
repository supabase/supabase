import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'

const PageTelemetry: FC = ({ children }) => {
  const router = useRouter()
  const { ui } = useStore()

  useEffect(() => {
    function handleRouteChange(url: string) {
      handlePageTelemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  useEffect(() => {
    /**
     * Send page telemetry on first page load
     * if the route is not ready. Don't need to send it will be picked up by router.event above
     */
    if (router.isReady) {
      handlePageTelemetry(router.asPath)
    }
  }, [])

  const handlePageTelemetry = async (route?: string) => {
    if (IS_PLATFORM) {
      /**
       * Get referrer from browser
       */
      let referrer: string | undefined = document.referrer

      /**
       * Send page telemetry
       *
       * TODO: document.title is lagging behind routeChangeComplete
       * that means the page title is the previous one instead of the new page title
       */
      post(`${API_URL}/telemetry/page`, {
        referrer: referrer,
        title: document.title,
        route,
        ga: {
          screen_resolution: ui.googleAnalyticsProps?.screenResolution,
          language: ui.googleAnalyticsProps?.language,
        },
      })
    }
  }

  return <>{children}</>
}

export default observer(PageTelemetry)
