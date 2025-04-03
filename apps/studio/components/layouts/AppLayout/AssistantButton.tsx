import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Button } from 'ui'

const AssistantButton = () => {
  const snap = useAiAssistantStateSnapshot()
  const { setEditorPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="assistant-trigger"
      className="h-full w-full rounded-none"
      onClick={() => {
        snap.toggleAssistant()
        setEditorPanel({ open: false })
      }}
    >
      <AiIconAnimation allowHoverEffect size={20} />
    </Button>
  )
}

export default AssistantButton
