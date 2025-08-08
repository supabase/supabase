import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation } from 'ui'
import { KeyboardShortcut } from 'ui'

export const AssistantButton = () => {
  const snap = useAiAssistantStateSnapshot()

  return (
    <ButtonTooltip
      type="text"
      size="tiny"
      id="assistant-trigger"
      className="rounded-none w-[32px] h-[30px] flex items-center justify-center p-0 hover:bg-brand-400"
      onClick={() => {
        snap.toggleAssistant()
      }}
      tooltip={{
        content: {
          text: (
            <div className="flex items-center gap-4">
              <span>AI Assistant</span>
              <KeyboardShortcut keys={['Meta', 'i']} />
            </div>
          ),
        },
      }}
    >
      <AiIconAnimation allowHoverEffect={false} size={16} />
    </ButtonTooltip>
  )
}
