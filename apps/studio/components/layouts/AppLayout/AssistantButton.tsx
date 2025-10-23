import { LOCAL_STORAGE_KEYS } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { SIDEBAR_KEYS, sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, cn, KeyboardShortcut } from 'ui'

export const AssistantButton = () => {
  useAiAssistantStateSnapshot()
  const sidebarSnap = useSidebarManagerSnapshot()
  const [isAIAssistantHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_AI_ASSISTANT,
    true
  )

  const isOpen = sidebarSnap.panels[SIDEBAR_KEYS.AI_ASSISTANT]?.open

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="assistant-trigger"
      className={cn(
        "rounded-full w-[32px] h-[32px] flex items-center justify-center p-0",
        isOpen && "bg-foreground text-background"
      )}
      onClick={() => {
        sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
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
      <AiIconAnimation
        allowHoverEffect={false}
        size={16}
        className={cn(isOpen && "text-background")}
      />
    </ButtonTooltip>
  )
}
