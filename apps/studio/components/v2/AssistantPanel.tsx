'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button, Input } from 'ui'

export function AssistantPanel() {
  const pathname = usePathname()
  const viewName = pathname?.split('/').filter(Boolean).slice(-2).join(' / ') ?? 'Dashboard'
  const [input, setInput] = useState('')

  return (
    <div className="flex flex-col h-full p-3">
      <p className="text-xs text-foreground-lighter mb-3">Context: {viewName}</p>
      <div className="flex-1 rounded border border-border bg-muted/30 p-3 mb-3 text-sm text-foreground-lighter">
        <p>Welcome. I can help you with your database, auth, storage, and more.</p>
        <p className="mt-2">Ask a question or describe what you want to do.</p>
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="text-sm flex-1"
        />
        <Button type="default" size="small">
          Send
        </Button>
      </div>
    </div>
  )
}
