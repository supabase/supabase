import * as Tooltip from '@radix-ui/react-tooltip'
import { Wand } from 'lucide-react'
import { Button } from 'ui'
import { useAppStateSnapshot } from 'state/app-state'

const AssistantButton = () => {
  const { setAiAssistantPanel, aiAssistantPanel } = useAppStateSnapshot()

  return (
    <Button
      id="assistant-trigger"
      onClick={() => {
        setAiAssistantPanel({ open: !aiAssistantPanel.open })
      }}
    >
      <Wand size={18} strokeWidth={1.5} className="text-foreground-light" />
    </Button>
  )
}

export default AssistantButton
