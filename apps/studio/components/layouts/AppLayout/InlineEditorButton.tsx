import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { SqlEditor } from 'icons'
import { SIDEBAR_KEYS, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, KeyboardShortcut } from 'ui'

export const InlineEditorButton = ({
  onClick,
  showShortcut = true,
}: {
  onClick: () => void
  showShortcut?: boolean
}) => {
  const sidebarSnap = useSidebarManagerSnapshot()
  const isOpen = sidebarSnap.panels[SIDEBAR_KEYS.EDITOR_PANEL]?.open

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="editor-trigger"
      className={cn(
        "rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground",
        isOpen && "bg-foreground text-background hover:text-background"
      )}
      onClick={onClick}
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
