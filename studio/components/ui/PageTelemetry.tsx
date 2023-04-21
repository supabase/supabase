import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'

function sanitizePageViewRoute(_route?: string) {
  // remove all fragments
  const noFragments = _route?.split('#')[0]
  // remove sensitive params
  const paramsSplits = noFragments?.split('?')
  const hasParams = paramsSplits && paramsSplits?.length > 1

  if (hasParams) {
    const urlParams = new URLSearchParams(paramsSplits[1])
    const sensitiveKeys = [...urlParams.keys()].filter((x) => x.includes('token'))
    const sensitiveParams = ['code', ...sensitiveKeys]
    sensitiveParams.forEach((name) => urlParams.delete(name))
    return `${paramsSplits[0]}?${urlParams?.toString()}`
  }

  return noFragments
}

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
  const handlePageTelemetry = async (_route?: string) => {
    if (IS_PLATFORM) {
      // filter out sensitive query params
      const route = sanitizePageViewRoute(_route)

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
          screen_resolution: ui.googleAnalyticsProps?.screenResolution,
          language: ui.googleAnalyticsProps?.language,
        },
      })
    }
  }

  return <>{children}</>
}

export default observer(PageTelemetry)
