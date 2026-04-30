import { SqlEditor } from 'icons'
import { cn, KeyboardShortcut } from 'ui'

import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const InlineEditorKeyboardTooltip = () => {
  const hotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.INLINE_EDITOR_TOGGLE)

  return hotkeyEnabled ? <KeyboardShortcut keys={['Meta', 'E']} /> : null
}

export const InlineEditorButton = () => {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()
  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.EDITOR_PANEL

  const handleClick = () => {
    toggleSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
  }

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="editor-trigger"
      className={cn(
        'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground',
        isOpen && 'bg-foreground text-background hover:text-background'
      )}
      onClick={handleClick}
      tooltip={{
        content: {
          className: 'p-1 pl-2.5',
          text: (
            <div className="flex items-center gap-2.5">
              <span>SQL Editor</span>
              <InlineEditorKeyboardTooltip />
            </div>
          ),
        },
      }}
    >
      <SqlEditor size={16} strokeWidth={1.5} />
    </ButtonTooltip>
  )
}
