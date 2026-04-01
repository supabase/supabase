import { useParams } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { BookOpenText } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

import { ButtonTooltip } from './ButtonTooltip'

interface APIDocsButtonProps {
  section?: string[]
  source: string
}

export const APIDocsButton = ({ section, source }: APIDocsButtonProps) => {
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
      className="w-7"
      tooltip={{
        content: {
          side: 'bottom',
          text: 'API Docs',
        },
      }}
    />
  )
}
