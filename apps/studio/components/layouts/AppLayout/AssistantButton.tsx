import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Button } from 'ui'

const AssistantButton = () => {
  const { setAiAssistantPanel, aiAssistantPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="assistant-trigger"
      className="w-[24px] h-[24px] flex items-center justify-center p-0"
      onClick={() => {
        setAiAssistantPanel({ open: !aiAssistantPanel.open })
      }}
    >
      <AiIconAnimation allowHoverEffect size={16} />
    </Button>
  )
}

export default AssistantButton
