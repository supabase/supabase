import { LOCAL_STORAGE_KEYS } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiIconAnimation, cn, KeyboardShortcut } from 'ui'

export const AssistantButton = () => {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()
  const [isAIAssistantHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.AI_ASSISTANT),
    true
  )

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.AI_ASSISTANT

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="assistant-trigger"
      className={cn(
        'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0',
        isOpen && 'bg-foreground text-background'
      )}
      onClick={() => {
        toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
      }}
      tooltip={{
        content: {
          className: 'p-1 pl-2.5',
          text: (
            <div className="flex items-center gap-2.5">
              <span>AI Assistant</span>
              {isAIAssistantHotkeyEnabled && <KeyboardShortcut keys={['Meta', 'I']} />}
            </div>
          ),
        },
      }}
    >
      <AiIconAnimation
        allowHoverEffect={false}
        size={16}
        className={cn(isOpen && 'text-background')}
      />
    </ButtonTooltip>
  )
}
