'use client'

import { RealtimeCursors } from '@/registry/default/blocks/realtime-cursor/components/realtime-cursors'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import { useEffect, useState } from 'react'
import { generateFullName } from './utils'

const RealtimeCursorDemo = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(generateFullName())
  }, [])

  return (
    <div className="flex flex-col w-40">
      <Label>Username</Label>
      <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      <RealtimeCursors roomName="realtime-cursor-example" username={username} />
    </div>
  )
}

export default RealtimeCursorDemo
