import { Code } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'

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
      icon={<Code strokeWidth={1.5} className="text-foreground-muted" />}
    >
      API Docs
    </Button>
  )
}

export default APIDocsButton
