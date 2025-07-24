import { BookOpenText } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface APIDocsButtonProps {
  section?: string[]
}

const APIDocsButton = ({ section }: APIDocsButtonProps) => {
  const snap = useAppStateSnapshot()

  return (
    <ButtonTooltip
      type="default"
      size="tiny"
      icon={<BookOpenText strokeWidth={1.5} size={14} />}
      onClick={() => {
        if (section) snap.setActiveDocsSection(section)
        snap.setShowProjectApiDocs(true)
      }}
      className="h-7 w-7 p-0"
      tooltip={{
        content: {
          side: 'bottom',
          text: 'API Docs',
        },
      }}
    />
  )
}

export default APIDocsButton
