import { Box } from 'lucide-react'
import { useState } from 'react'
import { AssistantChatForm } from 'ui-patterns/AssistantChat'

export default function AssistantChatDemo() {
  const [value, setValueState] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(event: React.FormEvent) {
    // set loading for 3 seconds and then reset
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1500)
  }

  return (
    <AssistantChatForm
      icon={<Box strokeWidth={1.5} size={24} className="text-foreground-muted" />}
      value={value}
      loading={loading}
      disabled={loading}
      onValueChange={(e) => setValueState(e.target.value)}
      onSubmit={async (event) => {
        event.preventDefault()
        handleSubmit(event)
      }}
    />
  )
}
