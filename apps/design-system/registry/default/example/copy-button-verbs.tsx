'use client'

import { Button } from 'ui'

export default function CopyButtonVerbs() {
  return (
    <div className="flex flex-row gap-16">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <Button type="primary">Table creation</Button>
        <Button type="primary">Save action</Button>
        <Button type="danger">Bucket deletion</Button>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <Button type="primary">Create table</Button>
        <Button type="primary">Save changes</Button>
        <Button type="danger">Delete bucket</Button>
      </div>
    </div>
  )
}
