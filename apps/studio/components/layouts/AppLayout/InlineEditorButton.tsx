import { SqlEditor } from 'icons'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useAppStateSnapshot } from 'state/app-state'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { KeyboardShortcut } from 'ui'

export const InlineEditorButton = () => {
  const { closeAssistant } = useAiAssistantStateSnapshot()
  const { setEditorPanel, editorPanel } = useAppStateSnapshot()

  return (
    <ButtonTooltip
      type="text"
      size="tiny"
      id="editor-trigger"
      className="rounded-none w-[32px] h-[30px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground"
      onClick={() => {
        closeAssistant()
        setEditorPanel({ open: !editorPanel.open })
      }}
      tooltip={{
        content: {
          text: (
            <div className="flex items-center gap-4">
              <span>SQL Editor</span>
              <KeyboardShortcut keys={['Meta', 'e']} />
            </div>
          ),
        },
      }}
    >
      <SqlEditor size={18} strokeWidth={1.5} />
    </ButtonTooltip>
  )
}
