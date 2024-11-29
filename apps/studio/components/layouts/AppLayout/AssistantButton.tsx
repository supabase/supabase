import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Button } from 'ui'

const AssistantButton = () => {
  const { setAiAssistantPanel, aiAssistantPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="assistant-trigger"
      onClick={() => {
        setAiAssistantPanel({ open: !aiAssistantPanel.open })
      }}
    >
      <AiIconAnimation allowHoverEffect size={20} />
    </Button>
  )
}

export default AssistantButton
