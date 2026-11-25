import { sendTelemetryEvent, useParams } from 'common'
import type {
  CommandMenuClosedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useCallback } from 'react'

import { useRoutePattern } from '@/hooks/misc/useRoutePattern'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { API_URL } from '@/lib/constants'
import { toRoutePattern } from '@/lib/internal-url'

export function useStudioCommandMenuTelemetry() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const pathname = toRoutePattern(useRoutePattern())

  const onTelemetry = useCallback(
    (
      event:
        | CommandMenuOpenedEvent
        | CommandMenuClosedEvent
        | CommandMenuCommandClickedEvent
        | CommandMenuSearchSubmittedEvent
    ) => {
      sendTelemetryEvent(
        API_URL,
        {
          ...event,
          groups: {
            ...event.groups,
            ...(projectRef && { project: projectRef }),
            ...(organization?.slug && { organization: organization.slug }),
          },
        },
        pathname
      )
    },
    [projectRef, organization?.slug, pathname]
  )

  return { onTelemetry }
}
