'use client'

import { RealtimeCursors } from '@/registry/default/blocks/realtime-cursor/components/realtime-cursors'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useEffect, useState } from 'react'

const names = ['Eren', 'Armin', 'Mikasa', 'Reiner', 'Levi', 'Bertholdt']

const RealtimeCursorDemo = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(names[Math.floor(Math.random() * names.length)])
  }, [])

  return (
    <div className="flex flex-col w-40 gap-3">
      <Label>Username</Label>
      <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      <RealtimeCursors roomName="realtime-cursor-example" username={username} />
    </div>
  )
}

export default RealtimeCursorDemo
