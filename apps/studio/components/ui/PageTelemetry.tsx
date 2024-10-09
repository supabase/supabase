import { Sha256 } from '@aws-crypto/sha256-browser'
import * as Sentry from '@sentry/nextjs'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams, useUser } from 'common'
import { useSendGroupsIdentifyMutation } from 'data/telemetry/send-groups-identify-mutation'
import { useSendGroupsResetMutation } from 'data/telemetry/send-groups-reset-mutation'
import { useSendPageLeaveMutation } from 'data/telemetry/send-page-leave-mutation'
import { useSendPageMutation } from 'data/telemetry/send-page-mutation'
import { usePrevious } from 'hooks/deprecated'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'

const getAnonId = async (id: string) => {
  const hash = new Sha256()
  hash.update(id)
  const u8Array = await hash.digest()
  const binString = Array.from(u8Array, (byte) => String.fromCodePoint(byte)).join('')
  const b64encoded = btoa(binString)
  return b64encoded
}

const PageTelemetry = ({ children }: PropsWithChildren<{}>) => {
  const user = useUser()
  const router = useRouter()
  const { ref, slug } = useParams()
  const snap = useAppStateSnapshot()
  const organization = useSelectedOrganization()

  const previousPathname = usePrevious(router.pathname)
  const enablePostHogTelemetry = useFlag('enablePosthogChanges')
  const consent =
    typeof window !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT)
      : null
  const trackTelemetryPH = enablePostHogTelemetry && consent === 'true'

  const { mutate: sendPage } = useSendPageMutation()
  const { mutateAsync: sendPageLeave } = useSendPageLeaveMutation()
  const { mutate: sendGroupsIdentify } = useSendGroupsIdentifyMutation()
  const { mutate: sendGroupsReset } = useSendGroupsResetMutation()

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

  useEffect(() => {
    const isLandingOnProjectRoute =
      router.pathname.includes('[ref]') && previousPathname === router.pathname
    const isEnteringProjectRoute =
      !(previousPathname ?? '').includes('[ref]') && router.pathname.includes('[ref]')
    const isLeavingProjectRoute =
      (previousPathname ?? '').includes('[ref]') && !router.pathname.includes('[ref]')

    const isLandingOnOrgRoute =
      router.pathname.includes('[slug]') && previousPathname === router.pathname
    const isEnteringOrgRoute =
      !(previousPathname ?? '').includes('[slug]') && router.pathname.includes('[slug]')
    const isLeavingOrgRoute =
      (previousPathname ?? '').includes('[slug]') && !router.pathname.includes('[slug]')

    if (trackTelemetryPH) {
      if (ref && (isLandingOnProjectRoute || isEnteringProjectRoute)) {
        sendGroupsIdentify({ organization_slug: organization?.slug, project_ref: ref as string })
      } else if (slug && (isLandingOnOrgRoute || isEnteringOrgRoute)) {
        sendGroupsIdentify({ organization_slug: slug, project_ref: undefined })
      } else if (isLeavingProjectRoute || isLeavingOrgRoute) {
        sendGroupsReset({
          reset_organization: isLeavingOrgRoute || isLeavingProjectRoute,
          reset_project: isLeavingProjectRoute,
        })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackTelemetryPH, slug, ref, router.pathname])

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (enablePostHogTelemetry && snap.isOptedInTelemetry) await sendPageLeave()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handlePageTelemetry = async (route: string) => {
    if (IS_PLATFORM) sendPage({ url: route })
  }

  return <>{children}</>
}

export default PageTelemetry
