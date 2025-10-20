import { useCallback } from 'react'

import { useParams } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import type { CommandMenuOpenedEvent } from 'common/telemetry-constants'

export function useStudioCommandMenuTelemetry() {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const onTelemetry = useCallback(
    (event: CommandMenuOpenedEvent) => {
      // Add studio-specific groups (project and organization)
      const eventWithGroups: CommandMenuOpenedEvent = {
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
