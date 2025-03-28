'use client'

import { RealtimeChat } from '@/registry/default/blocks/realtime-chat/components/realtime-chat'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useEffect, useState } from 'react'

const names = ['Mark S', 'Milchick']

const RealtimeChatDemo = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(names[Math.floor(Math.random() * names.length)])
  }, [])

  return (
    <div className="flex flex-col w-40 gap-3">
      <Label>Username</Label>
      <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      <RealtimeChat roomName="realtime-chat-example" username={username} />
    </div>
  )
}

export default RealtimeChatDemo
