import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { FC, useEffect } from 'react'
import { User } from 'types'

const PageTelemetry: FC = ({ children }) => {
  const router = useRouter()
  const { ui } = useStore()
  const { profile } = ui
  let clientId: string

  useEffect(() => {
    function handleRouteChange() {
      handlePageTelemetry(profile)
    }

    // @ts-ignore
    window?.gtag(
      'get',
      `'${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}'`,
      'client_id',
      // @ts-ignore
      (client_id) => {
        console.log(client_id)
        clientId = client_id
      }
    )

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, profile])

  useEffect(() => {
    /**
     * Send page telemetry on first page load
     * if there asPath is defined, then this isn't needed
     */
    if (router.route === '/' && router.asPath === '/') {
      handlePageTelemetry(profile)
    }
  }, [])

  const handlePageTelemetry = async (profile?: User) => {
    if (IS_PLATFORM) {
      /**
       * Get referrer from browser
       */
      let referrer: string | undefined = document.referrer

      console.log('my clientId = ', clientId)

      /**
       * Send page telemetry
       *
       * TODO: document.title is lagging behind routeChangeComplete
       * that means the page title is the previous one instead of the new page title
       */
      post(`${API_URL}/telemetry/page`, {
        referrer: referrer,
        title: document.title,
      })
    }
  }

  return <>{children}</>
}

export default observer(PageTelemetry)
