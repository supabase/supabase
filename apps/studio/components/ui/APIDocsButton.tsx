import { useParams } from 'common'
import { BookOpenText } from 'lucide-react'

import { ButtonTooltip } from './ButtonTooltip'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useAppStateSnapshot } from '@/state/app-state'

interface APIDocsButtonProps {
  section?: string[]
  source: string
  label?: string
  tooltip?: string
}

export const APIDocsButton = ({ section, source, label, tooltip }: APIDocsButtonProps) => {
  const snap = useAppStateSnapshot()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <ButtonTooltip
      size="tiny"
      type="default"
      onClick={() => {
        if (section) snap.setActiveDocsSection(section)
        snap.setShowProjectApiDocs(true)

        sendEvent({
          action: 'api_docs_opened',
          properties: {
            source,
          },
          groups: {
            project: ref ?? 'Unknown',
            organization: org?.slug ?? 'Unknown',
          },
        })
      }}
      icon={<BookOpenText />}
      className={label ? undefined : 'w-7'}
      tooltip={{
        content: {
          side: 'bottom',
          text: tooltip ?? 'API Docs',
        },
      }}
    >
      {label}
    </ButtonTooltip>
  )
}
