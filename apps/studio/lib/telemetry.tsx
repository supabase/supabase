import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS, PageTelemetry, useUser } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { useConsentToast } from 'ui-patterns/consent'

const getAnonId = async (id: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(id)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const base64String = btoa(hashArray.map((byte) => String.fromCharCode(byte)).join(''))

  return base64String
}

export function Telemetry() {
  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsentToast() : { hasAcceptedConsent: true }

  // Get org from selected organization query because it's not
  // always available in the URL params
  const { data: organization } = useSelectedOrganizationQuery()

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

  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
      organizationSlug={organization?.slug}
    />
  )
}
