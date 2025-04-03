'use client'

import { RealtimeChat } from '@/registry/default/blocks/realtime-chat/components/realtime-chat'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useEffect, useState } from 'react'

const names = [
  'Mark S',
  'Milchick',
  'Irving',
  'Gemma',
  'Dylan',
  'Helly R',
  'Harmony',
  'Terry',
  'Ivan',
  'Alaister',
  'Joshen',
  'Jordi',
  'Filipe',
]

const RealtimeChatDemo = ({ roomName }: { roomName: string }) => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(names[Math.floor(Math.random() * names.length)])
  }, [])

  const messages = [
    {
      id: '1',
      content: 'Where are you Dylan?',
      user: {
        name: 'Harmony',
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      content: 'in the bathroom',
      user: {
        name: 'Dylan',
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      content: "Please don't tell us what you're doing in the bathroom",
      user: {
        name: 'Mark S',
      },
      createdAt: new Date().toISOString(),
    },
  ]

  return (
    <div className="flex flex-col w-full h-[600px] p-4">
      <div className="p-4">
        <Label className="text-xs font-medium mb-1 -ml-4 text-foreground-light">Username</Label>
        <Input
          autoComplete="off"
          className="text-sm -ml-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden">
        {roomName && <RealtimeChat roomName={roomName} username={username} messages={messages} />}
      </div>
    </div>
  )
}

export default RealtimeChatDemo
