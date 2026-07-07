import * as Sentry from '@sentry/nextjs'
import { PageTelemetry, posthogClient, useParams, useUser } from 'common'
import { useEffect, useRef } from 'react'
import { useConsentToast } from 'ui-patterns/consent'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { API_URL, IS_PLATFORM } from '@/lib/constants'

export function Telemetry() {
  // Although this is "technically" breaking the rules of hooks
  // IS_PLATFORM never changes within a session, so this won't cause any issues
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { hasAcceptedConsent } = IS_PLATFORM ? useConsentToast() : { hasAcceptedConsent: true }

  // Get org from selected organization query because it's not
  // always available in the URL params
  const { data: organization } = useSelectedOrganizationQuery()

  const user = useUser()

  // Project ref from the URL params, mirroring the backend's `request.params.ref`
  const { ref: projectRef } = useParams()

  // Mirror the user's org-list length into a PostHog person property so feature
  // flags and analytics can segment by current org membership. signup_timestamp
  // is set on the same identify so flag audiences requiring both properties see
  // them together on /decide. Only fires when the value changes.
  const { data: organizations } = useOrganizationsQuery()
  const lastSentRef = useRef<{
    userId: string
    orgCount: number
    signupTimestamp?: string
  } | null>(null)
  useEffect(() => {
    if (!user?.id || !organizations) return
    const orgCount = organizations.length
    const signupTimestamp = user.created_at ?? undefined
    const last = lastSentRef.current
    if (
      last?.userId === user.id &&
      last.orgCount === orgCount &&
      last.signupTimestamp === signupTimestamp
    ) {
      return
    }
    lastSentRef.current = { userId: user.id, orgCount, signupTimestamp }
    posthogClient.identify(user.id, {
      org_count: orgCount,
      ...(signupTimestamp && { signup_timestamp: signupTimestamp }),
    })
  }, [user?.id, user?.created_at, organizations])

  useEffect(() => {
    // don't set the sentry user id if the user hasn't logged in (so that Sentry errors show null user id instead of anonymous id)
    if (user?.id) {
      Sentry.setUser({ id: user.id })
    }

    // Tag Sentry events with the current project ref and customer org slug so backend/
    // frontend errors can be filtered by project / org. Passing a null value clears
    // the tag, so stale values don't leak across navigation.
    Sentry.setTag('project_ref', projectRef ?? null)
    Sentry.setTag('org_slug', organization?.slug ?? null)
  }, [user?.id, projectRef, organization?.slug])

  return (
    <PageTelemetry
      API_URL={API_URL}
      hasAcceptedConsent={hasAcceptedConsent}
      enabled={IS_PLATFORM}
      organizationSlug={organization?.slug}
    />
  )
}
