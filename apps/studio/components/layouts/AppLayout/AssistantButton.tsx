import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation, Button } from 'ui'

export const AssistantButton = () => {
  const snap = useAiAssistantStateSnapshot()
  const { setEditorPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="assistant-trigger"
      className="w-[24px] h-[24px] flex items-center justify-center p-0"
      onClick={() => {
        snap.toggleAssistant()
        setEditorPanel({ open: false })
      }}
    >
      <AiIconAnimation allowHoverEffect size={16} />
    </Button>
  )
}
