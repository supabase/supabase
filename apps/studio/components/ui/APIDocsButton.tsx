import { useAppStateSnapshot } from 'state/app-state'
import { Button, IconCode } from 'ui'

interface APIDocsButtonProps {
  section?: string[]
}

const APIDocsButton = ({ section }: APIDocsButtonProps) => {
  const snap = useAppStateSnapshot()

  return (
    <Button
      size="tiny"
      type="default"
      onClick={() => {
        if (section) snap.setActiveDocsSection(section)
        snap.setShowProjectApiDocs(true)
      }}
      icon={<IconCode size={14} strokeWidth={2} />}
    >
      API Docs
    </Button>
  )
}

export default APIDocsButton
