import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, cn, KeyboardShortcut } from 'ui'

export const AssistantButton = () => {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()
  const isMobile = useBreakpoint('md')
  const [isAIAssistantHotkeyEnabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(SIDEBAR_KEYS.AI_ASSISTANT),
    true
  )

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.AI_ASSISTANT

  const handleClick = () => {
    if (isMobile && isOpen) return
    toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
  }

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="assistant-trigger"
      className={cn(
        'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0',
        isOpen && 'bg-foreground text-background'
      )}
      onClick={handleClick}
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
