import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect } from 'react'

import { useUser } from 'common'
import { useSendPageMutation } from 'data/telemetry/send-page-mutation'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { getAnonId } from 'lib/telemetry'
import { useAppStateSnapshot } from 'state/app-state'

const PageTelemetry = ({ children }: PropsWithChildren<{}>) => {
  const user = useUser()
  const router = useRouter()
  const snap = useAppStateSnapshot()

  const { mutate: sendPage } = useSendPageMutation()

  useEffect(() => {
    const consent =
      typeof window !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
        : null
    if (consent !== null) snap.setIsOptedInTelemetry(consent === 'true')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleRouteChange() {
      if (snap.isOptedInTelemetry) handlePageTelemetry(window.location.href)
    }

    // Listen for page changes after a navigation or when the query changes
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, snap.isOptedInTelemetry])

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for router ready before sending page_view
    // if not the path will be dynamic route instead of the browser url
    if (router.isReady && snap.isOptedInTelemetry) {
      handlePageTelemetry(window.location.href)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, snap.isOptedInTelemetry])

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

  const handlePageTelemetry = async (route: string) => {
    if (IS_PLATFORM) sendPage({ url: route })
  }

  return <>{children}</>
}

export default PageTelemetry
