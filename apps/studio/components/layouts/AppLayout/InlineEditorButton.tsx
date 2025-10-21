import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { SqlEditor } from 'icons'
import { SIDEBAR_KEYS, sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, KeyboardShortcut } from 'ui'

export const InlineEditorButton = ({
  showShortcut = true,
}: {
  showShortcut?: boolean
}) => {
  const sidebarSnap = useSidebarManagerSnapshot()
  const isOpen = sidebarSnap.panels[SIDEBAR_KEYS.EDITOR_PANEL]?.open

  const handleClick = () => {
    if (isOpen) {
      sidebarManagerState.closeSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    }
  }

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="editor-trigger"
      className={cn(
        "rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground",
        isOpen && "bg-foreground text-background hover:text-background"
      )}
      onClick={handleClick}
      tooltip={{
        content: {
          text: (
            <div className="flex items-center gap-4">
              <span>SQL Editor</span>
              {showShortcut && <KeyboardShortcut keys={['Meta', 'e']} />}
            </div>
          ),
        },
      }}
    >
      <SqlEditor size={18} strokeWidth={1.5} />
    </ButtonTooltip>
  )
}
