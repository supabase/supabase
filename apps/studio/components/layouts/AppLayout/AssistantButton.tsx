import { AiIconAnimation, cn, KeyboardShortcut } from 'ui'

import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const AssistantButton = () => {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()
  const isAIAssistantHotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.AI_ASSISTANT_TOGGLE)
  const track = useTrack()

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
        track('header_assistant_button_clicked')
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
      <span className="sr-only">AI Assistant</span>
    </ButtonTooltip>
  )
}
