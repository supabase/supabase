import { useParams } from 'common'
import type {
  CommandMenuCommandClickedEvent,
  CommandMenuOpenedEvent,
  CommandMenuSearchSubmittedEvent,
} from 'common/telemetry-constants'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useCallback } from 'react'

export function useStudioCommandMenuTelemetry() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const onTelemetry = useCallback(
    (
      event:
        | CommandMenuOpenedEvent
        | CommandMenuCommandClickedEvent
        | CommandMenuSearchSubmittedEvent
    ) => {
      // Add studio-specific groups (project and organization)
      const eventWithGroups = {
        ...event,
        groups: {
          ...event.groups,
          ...(projectRef && { project: projectRef }),
          ...(organization?.slug && { organization: organization.slug }),
        },
      }

      sendEvent(eventWithGroups)
    },
    [projectRef, organization?.slug, sendEvent]
  )

  return { onTelemetry }
}
