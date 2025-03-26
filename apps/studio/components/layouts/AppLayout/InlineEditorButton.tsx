import { useAppStateSnapshot } from 'state/app-state'
import { Button } from 'ui'
import { SqlEditor } from 'icons'

const InlineEditorButton = () => {
  const { setEditorPanel, editorPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      size="tiny"
      id="editor-trigger"
      className="h-full w-full rounded-none text-foreground-light"
      onClick={() => {
        setEditorPanel({ open: !editorPanel.open })
      }}
    >
      <SqlEditor size={20} strokeWidth={1.5} />
    </Button>
  )
}

export default InlineEditorButton
