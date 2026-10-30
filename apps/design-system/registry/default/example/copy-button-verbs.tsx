'use client'

import { Button } from 'ui'

export default function CopyButtonVerbs() {
  return (
    <div className="flex flex-row gap-16">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <Button variant="primary">Table creation</Button>
        <Button variant="primary">Save action</Button>
        <Button variant="danger">Bucket deletion</Button>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <Button variant="primary">Create table</Button>
        <Button variant="primary">Save changes</Button>
        <Button variant="danger">Delete bucket</Button>
      </div>
    </div>
  )
}
