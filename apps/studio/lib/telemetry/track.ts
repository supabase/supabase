import { sendTelemetryEvent, useFramework } from 'common'
import {
  RouteRequestsEvaluatedEvent,
  TelemetryEvent,
  TelemetryGroups,
} from 'common/telemetry-constants'
import { useCallback } from 'react'

import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { API_URL } from '@/lib/constants'

type EventMap = {
  [E in TelemetryEvent as E['action']]: E
}

type PropertiesForAction<A extends keyof EventMap> = EventMap[A] extends { properties: infer P }
  ? P
  : never

type HasProperties<A extends keyof EventMap> = EventMap[A] extends { properties: any }
  ? true
  : false

/**
 * Hook for type-safe telemetry event tracking with automatic project/org context injection.
 *
 * @example
 * const track = useTrack()
 * track('table_created', { method: 'sql_editor' })
 * track('help_button_clicked')
 */
export const useTrack = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { pathname } = useFramework()

  const latest = useLatest({
    projectRef: project?.ref,
    orgSlug: org?.slug,
    pathname,
  })

  const track = useCallback(
    <A extends keyof EventMap>(
      action: A,
      ...args: HasProperties<A> extends true
        ? [properties: PropertiesForAction<A>, groupOverrides?: Partial<TelemetryGroups>]
        : [properties?: undefined, groupOverrides?: Partial<TelemetryGroups>]
    ) => {
      const { projectRef, orgSlug, pathname } = latest.current
      const [properties, groupOverrides] = args

      const groups = {
        ...(projectRef && { project: projectRef }),
        ...(orgSlug && { organization: orgSlug }),
        ...groupOverrides,
      }

      const event = {
        action,
        ...(properties && { properties }),
        ...(groups && { groups }),
      } as EventMap[A]

      sendTelemetryEvent(API_URL, event, pathname)
    },
    []
  )

  return track
}

/**
 * Sends the `route_requests_evaluated` summary of a finished route visit. This is the one event
 * that does not go through `useTrack`, because it differs in three ways:
 *
 * - It is sent as the previous page is left (navigation, tab hidden, unload), when the current
 *   project, org and pathname already belong to the next page. So it carries no project or org
 *   group, and the pathname is the visit's own route template, never the live one.
 * - It may be sent as the page unloads, so it does not wait to read the access token first (the
 *   endpoint identifies the user from cookies).
 * - It is sent from outside React (router and document listeners), so it cannot use a hook.
 *
 * Consent is still checked by `sendTelemetryEvent`.
 */
export function trackRouteVisit(
  properties: RouteRequestsEvaluatedEvent['properties'],
  { isLeavingPage = false }: { isLeavingPage?: boolean } = {}
) {
  sendTelemetryEvent(
    API_URL,
    { action: 'route_requests_evaluated', properties },
    properties.routeTemplate,
    { skipAccessToken: isLeavingPage }
  )
}
