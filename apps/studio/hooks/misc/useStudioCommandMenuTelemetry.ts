import { sendTelemetryEvent, useFramework, useParams } from 'common'
import type {
  CommandMenuClosedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useCallback } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { API_URL } from '@/lib/constants'

export function useStudioCommandMenuTelemetry() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { pathname } = useFramework()

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
