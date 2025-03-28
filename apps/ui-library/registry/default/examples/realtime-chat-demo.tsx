'use client'

import { RealtimeChat } from '@/registry/default/blocks/realtime-chat/components/realtime-chat'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useEffect, useState } from 'react'

const names = ['Mark S', 'Milchick', 'Irving', 'Gemma', 'Dylan', 'Helly R', 'Harmony']

const RealtimeChatDemo = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(names[Math.floor(Math.random() * names.length)])
  }, [])

  return (
    <div className="flex flex-col w-full max-w-2xl h-[600px] border rounded-lg">
      <div className="p-4 border-b">
        <Label>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="flex-1">
        <RealtimeChat roomName="chat-demo" username={username} />
      </div>
    </div>
  )
}

export default ChatDemo
