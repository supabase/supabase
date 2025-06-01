import React, { useRef, useState } from 'react'
import { AssistantChatForm, AssistantCommandsPopover } from 'ui-patterns/AssistantChat'

export default function AssistantChatCommands() {
  const [commandsOpen, setCommandsOpen] = useState<boolean>(false)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValueState] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    // set loading for 3 seconds and then reset
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  const suggestions = [
    'Add policy for org Inserted User Access',
    'Add policy for User-Specific Todo Access',
    'Add policy for Org Update Restriction',
  ]

  return (
    <div className="flex flex-col gap-3">
      <AssistantCommandsPopover
        open={commandsOpen}
        setOpen={setCommandsOpen}
        textAreaRef={textAreaRef}
        value={value}
        setValue={(e) => setValueState(e)}
        suggestions={suggestions}
      >
        <AssistantChatForm
          textAreaRef={textAreaRef}
          value={value}
          loading={loading}
          disabled={loading}
          onValueChange={(e) => setValueState(e.target.value)}
          commandsOpen={commandsOpen}
          setCommandsOpen={setCommandsOpen}
          onSubmit={async (event) => {
            event.preventDefault()
            handleSubmit(event)
          }}
        />
      </AssistantCommandsPopover>
      <p className="text-xs mt-3 text-foreground-lighter">
        Press <span className="bg-surface-300 px-[3px] py-[2px] border rounded">/</span> to open
        commands
      </p>
    </div>
  )
}
