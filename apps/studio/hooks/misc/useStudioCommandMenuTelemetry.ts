import { sendTelemetryEvent, useParams } from 'common'
import type {
  CommandMenuClosedEvent,
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { API_URL } from '@/lib/constants'

export function useStudioCommandMenuTelemetry() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const router = useRouter()

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
        router.pathname
      )
    },
    [projectRef, organization?.slug, router.pathname]
  )

  return { onTelemetry }
}
