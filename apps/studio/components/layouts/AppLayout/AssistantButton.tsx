import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, Button } from 'ui'

const AssistantButton = () => {
  const snap = useAiAssistantStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="assistant-trigger"
      className="h-full w-full rounded-none"
      onClick={() => {
        snap.toggleAssistant()
      }}
    >
      <AiIconAnimation allowHoverEffect size={20} />
    </Button>
  )
}

export default AssistantButton
