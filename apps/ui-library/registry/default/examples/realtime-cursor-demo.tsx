'use client'

import { RealtimeCursors } from '../blocks/realtime-cursor/components/realtime-cursors'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '@ui/components/shadcn/ui/button'
import { RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { generateFullName } from './utils'

const RealtimeCursorDemo = () => {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(generateFullName())
  }, [])

  return (
    <div className="flex flex-col w-44">
      <Label>Username</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled />
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setUsername(generateFullName())}
          className="px-2"
        >
          <RefreshCcw size={18} />
        </Button>
      </div>

      <RealtimeCursors roomName="realtime-cursor-example" username={username} />
    </div>
  )
}

export default RealtimeCursorDemo
