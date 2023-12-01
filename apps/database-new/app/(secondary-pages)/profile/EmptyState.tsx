'use client'

import Link from 'next/link'
import { Button } from 'ui'

const EmptyState = () => {
  return (
    <div className="border rounded py-6 flex flex-col items-center justify-center gap-y-2">
      <p className="text-sm text-foreground-light">No conversations created yet</p>
      <Button type="default">
        <Link href="/">Start a conversation</Link>
      </Button>
    </div>
  )
}

export default EmptyState
