import { BookOpenText } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { ButtonTooltip } from './ButtonTooltip'

interface APIDocsButtonProps {
  section?: string[]
}

export const APIDocsButton = ({ section }: APIDocsButtonProps) => {
  const snap = useAppStateSnapshot()

  return (
    <ButtonTooltip
      size="tiny"
      type="default"
      onClick={() => {
        if (section) snap.setActiveDocsSection(section)
        snap.setShowProjectApiDocs(true)
      }}
      icon={<BookOpenText />}
      className="h-7 w-7"
      tooltip={{
        content: {
          side: 'bottom',
          text: 'API Docs',
        },
      }}
    />
  )
}
