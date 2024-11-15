import * as Tooltip from '@radix-ui/react-tooltip'
import { Code2, Wand } from 'lucide-react'
import { Button } from 'ui'
import { useAppStateSnapshot } from 'state/app-state'
import { AiIconAnimation } from 'ui'

const InlineEditorButton = () => {
  const { setInlineEditorPanel, inlineEditorPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      id="inline-editor-trigger"
      className="w-6 h-6"
      onClick={() => {
        setInlineEditorPanel({ open: !inlineEditorPanel.open })
      }}
      icon={<Code2 size={20} strokeWidth={1.5} />}
    />
  )
}

export default InlineEditorButton
