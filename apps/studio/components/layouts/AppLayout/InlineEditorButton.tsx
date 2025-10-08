import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { SqlEditor } from 'icons'
import { KeyboardShortcut } from 'ui'

export const InlineEditorButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <ButtonTooltip
      type="text"
      size="tiny"
      id="editor-trigger"
      className="rounded-none w-[32px] h-[30px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground"
      onClick={onClick}
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
