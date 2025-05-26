import { SqlEditor } from 'icons'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'

export const InlineEditorButton = () => {
  const { closeAssistant } = useAiAssistantStateSnapshot()
  const { setEditorPanel, editorPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="editor-trigger"
      className="w-[24px] h-[24px] flex items-center justify-center p-0"
      onClick={() => {
        closeAssistant()
        setEditorPanel({ open: !editorPanel.open })
      }}
    >
      <SqlEditor size={20} strokeWidth={1.5} />
    </Button>
  )
}
