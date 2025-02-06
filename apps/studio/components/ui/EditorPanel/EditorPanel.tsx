import { MessageSquare, X } from 'lucide-react'
import { AiIconAnimation, Button } from 'ui'
import { useAppStateSnapshot } from 'state/app-state'
import SQLEditor from './SQLEditor'
import { useEffect, useState } from 'react'

interface EditorPanelHeaderProps {
  onClose: () => void
  onChat: () => void
}

const EditorPanelHeader = ({ onClose, onChat }: EditorPanelHeaderProps) => {
  return (
    <div className="border-b flex shrink-0 items-center bg gap-x-3 px-5 h-[46px]">
      <span className="text-sm flex-1">SQL Editor</span>
      <div className="flex gap-2 items-center">
        <Button size="tiny" type="default" onClick={onChat} icon={<AiIconAnimation size={14} />}>
          Chat
        </Button>
        <Button
          size="tiny"
          type="default"
          className="w-7"
          onClick={onClose}
          icon={<X size={14} />}
        />
      </div>
    </div>
  )
}

export const EditorPanel = () => {
  const { setEditorPanel, setAiAssistantPanel } = useAppStateSnapshot()
  const [currentSql, setCurrentSql] = useState<string>('')

  useEffect(() => {
    setEditorPanel({
      initialValue: currentSql,
    })
  }, [currentSql, setEditorPanel])

  const handleChat = () => {
    if (currentSql) {
      setAiAssistantPanel({
        open: true,
        sqlSnippets: [currentSql],
        initialInput: 'Help me understand and improve this SQL query...',
        suggestions: {
          title:
            'I can help you understand and improve your SQL query. Here are a few example prompts to get you started:',
          prompts: [
            'Explain what this query does...',
            'Help me optimize this query...',
            'Show me how to add more conditions...',
            'Help me join this with another table...',
          ],
        },
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l">
      <EditorPanelHeader onClose={() => setEditorPanel({ open: false })} onChat={handleChat} />
      <SQLEditor onChange={setCurrentSql} />
    </div>
  )
}

export default EditorPanel
