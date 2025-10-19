import { LOCAL_STORAGE_KEYS } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { AiIconAnimation, KeyboardShortcut } from 'ui'

export const AssistantButton = () => {
  const snap = useAiAssistantStateSnapshot()
  const [isAIAssistantHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_AI_ASSISTANT,
    true
  )

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
              {isAIAssistantHotkeyEnabled && <KeyboardShortcut keys={['Meta', 'i']} />}
            </div>
          ),
        },
      }}
    >
      <AiIconAnimation allowHoverEffect={false} size={16} />
    </ButtonTooltip>
  )
}
