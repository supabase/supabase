import { Sha256 } from '@aws-crypto/sha256-browser'
import * as Sentry from '@sentry/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { PropsWithChildren, useEffect, useState } from 'react'

import { useParams, useUser } from 'common'
import { useSendGroupsIdentifyMutation } from 'data/telemetry/send-groups-identify-mutation'
import { useSendGroupsResetMutation } from 'data/telemetry/send-groups-reset-mutation'
import { useSendPageLeaveMutation } from 'data/telemetry/send-page-leave-mutation'
import { useSendPageMutation } from 'data/telemetry/send-page-mutation'
import { usePrevious } from 'hooks/deprecated'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { useConsent } from 'ui-patterns/ConsentToast'

const getAnonId = async (id: string) => {
  const hash = new Sha256()
  hash.update(id)
  const u8Array = await hash.digest()
  const binString = Array.from(u8Array, (byte) => String.fromCodePoint(byte)).join('')
  const b64encoded = btoa(binString)
  return b64encoded
}

const PageTelemetry = ({ children }: PropsWithChildren<{}>) => {
  const pathname = usePathname()
  const user = useUser()

  const { ref, slug } = useParams()
  const snap = useAppStateSnapshot()
  const organization = useSelectedOrganization()

  const { consentValue, hasAcceptedConsent } = useConsent()
  const previousPathname = usePrevious(pathname)

  const trackTelemetryPH = consentValue === 'true'
  const { mutate: sendPage } = useSendPageMutation()
  const { mutateAsync: sendPageLeave } = useSendPageLeaveMutation()
  const { mutate: sendGroupsIdentify } = useSendGroupsIdentifyMutation()
  const { mutate: sendGroupsReset } = useSendGroupsResetMutation()

  useEffect(() => {
    if (consentValue !== null) {
      snap.setIsOptedInTelemetry(hasAcceptedConsent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentValue])

  useEffect(() => {
    function handleRouteChange() {
      // Check telemetry consent and send page telemetry if opted in
      if (snap.isOptedInTelemetry) {
        handlePageTelemetry(window.location.href)
      }
    }

    // Send telemetry on route change or when query changes
    handleRouteChange()

    return () => {
      // No need for event cleanup here in App Router
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, snap.isOptedInTelemetry])

  useEffect(() => {
    // Send page telemetry on first page load
    // Waiting for pathname to be available before sending page_view
    // If not, the path might be a dynamic route instead of the browser URL
    if (pathname && snap.isOptedInTelemetry) {
      handlePageTelemetry(window.location.href)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, snap.isOptedInTelemetry])

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
    const isLandingOnProjectRoute = pathname?.includes('[ref]') && previousPathname === pathname
    const isEnteringProjectRoute =
      !(previousPathname ?? '').includes('[ref]') && pathname?.includes('[ref]')
    const isLeavingProjectRoute =
      (previousPathname ?? '').includes('[ref]') && !pathname?.includes('[ref]')

    const isLandingOnOrgRoute = pathname?.includes('[slug]') && previousPathname === pathname
    const isEnteringOrgRoute =
      !(previousPathname ?? '').includes('[slug]') && pathname?.includes('[slug]')
    const isLeavingOrgRoute =
      (previousPathname ?? '').includes('[slug]') && !pathname?.includes('[slug]')

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
  }, [trackTelemetryPH, slug, ref, pathname])

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (snap.isOptedInTelemetry) await sendPageLeave()
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
