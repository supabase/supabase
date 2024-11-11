import * as Tooltip from '@radix-ui/react-tooltip'
import { Wand } from 'lucide-react'
import { Button } from 'ui'
import { useAppStateSnapshot } from 'state/app-state'

const AssistantButton = () => {
  const { setAiAssistantPanel, aiAssistantPanel } = useAppStateSnapshot()

  return (
    <Button
      type="text"
      id="assistant-trigger"
      className="w-6 h-6"
      onClick={() => {
        setAiAssistantPanel({ open: !aiAssistantPanel.open })
      }}
      icon={<Wand size={18} strokeWidth={1.5} className="text-foreground-light" />}
    />
  )
}

export default AssistantButton
