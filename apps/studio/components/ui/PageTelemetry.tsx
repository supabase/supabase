import * as Sentry from '@sentry/nextjs'
import { useTelemetryProps, useUser } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { getAnonId } from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'

const PageTelemetry = ({ children }: PropsWithChildren<{}>) => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const snap = useAppStateSnapshot()

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (router.isReady) {
        if (snap.isOptedInTelemetry) handlePageLeaveTelemetry()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [router.isReady, snap.isOptedInTelemetry])

  useEffect(() => {
    const consent =
      typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
        : null
    if (consent !== null) snap.setIsOptedInTelemetry(consent === 'true')
  }, [])

  useEffect(() => {
    function handleRouteChange(url: string) {
      if (snap.isOptedInTelemetry) handlePageTelemetry(url)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router, snap.isOptedInTelemetry])

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for router ready before sending page_view
    // if not the path will be dynamic route instead of the browser url
    if (router.isReady && snap.isOptedInTelemetry) {
      handlePageTelemetry(router.asPath)
    }
  }, [router.isReady, snap.isOptedInTelemetry])

  const user = useUser()
  useEffect(() => {
    // don't set the sentry user id if the user hasn't logged in (so that Sentry errors show null user id instead of anonymous id)
    if (!user?.id) {
      return
    }

    const setSentryId = async () => {
      let sentryUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.SENTRY_USER_ID)
      if (!sentryUserId) {
        sentryUserId = await getAnonId(user?.id)
        localStorage.setItem(LOCAL_STORAGE_KEYS.SENTRY_USER_ID, sentryUserId)
      }
      Sentry.setUser({ id: sentryUserId })
    }

    // if an error happens, continue without setting a sentry id
    setSentryId().catch((e) => console.error(e))
  }, [user?.id])

  /**
   * send page_view event
   *
   * @param route: the browser url
   * */
  const handlePageTelemetry = async (route: string) => {
    if (IS_PLATFORM) {
      /**
       * Send page telemetry
       */
      post(
        `${API_URL}/telemetry/page`,
        {
          page_url: document.location.href,
          page_title: document.title,
          pathname: route,
          ph: {
            referrer: document.referrer,
            ...telemetryProps,
          },
        },
        {
          credentials: 'include',
        }
      )
    }
  }

  const handlePageLeaveTelemetry = async () => {
    if (IS_PLATFORM) {
      post(
        `${API_URL}/telemetry/pageleave`,
        {
          page_url: document.location.href,
          page_title: document.title,
          pathname: document.location.pathname,
        },
        {
          credentials: 'include',
        }
      )
    }
  }

  return <>{children}</>
}

export default PageTelemetry
