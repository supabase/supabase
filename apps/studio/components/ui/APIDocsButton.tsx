import { BookOpenText } from 'lucide-react'

import { ButtonTooltip } from './ButtonTooltip'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

interface APIDocsButtonProps {
  section?: string[]
  source: string
  label?: string
  tooltip?: string
}

export const APIDocsButton = ({ section, source, label, tooltip }: APIDocsButtonProps) => {
  const snap = useAppStateSnapshot()
  const track = useTrack()

  return (
    <ButtonTooltip
      size="tiny"
      type="default"
      onClick={() => {
        if (section) snap.setActiveDocsSection(section)
        snap.setShowProjectApiDocs(true)

        track('api_docs_opened', { source })
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
