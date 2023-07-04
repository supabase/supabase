import { useTelemetryProps } from 'common'
import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'

const PageTelemetry: FC = ({ children }) => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  useEffect(() => {
    function handleRouteChange(url: string) {
      handlePageTelemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for router ready before sending page_view
    // if not the path will be dynamic route instead of the browser url
    if (router.isReady) {
      handlePageTelemetry(router.asPath)
    }
  }, [router.isReady])

  /**
   * send page_view event
   *
   * @param route: the browser url
   * */
  const handlePageTelemetry = async (route: string) => {
    if (IS_PLATFORM) {
      /**
       * Get referrer from browser
       */
      let referrer: string | undefined = document.referrer

      /**
       * Send page telemetry
       */
      post(`${API_URL}/telemetry/page`, {
        referrer: referrer,
        title: document.title,
        route,
        ga: {
          screen_resolution: telemetryProps?.screenResolution,
          language: telemetryProps?.language,
        },
      })

      post(`${API_URL}/telemetry/pageview`, {
        referrer: referrer,
        title: document.title,
        path: router.route,
        location: router.asPath,
      })
    }
  }

  return <>{children}</>
}

export default observer(PageTelemetry)
