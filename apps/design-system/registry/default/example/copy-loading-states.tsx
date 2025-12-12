'use client'

import { Button } from 'ui'

export default function CopyLoadingStates() {
  return (
    <div className="flex flex-row gap-16">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-col gap-4">
          <Button type="primary" loading>
            Please wait...
          </Button>
          <Button type="primary" loading>
            Loading...
          </Button>
          <Button type="danger" loading>
            Processing...
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-col gap-4">
          <Button type="primary" loading>
            Creating table...
          </Button>
          <Button type="primary" loading>
            Loading schema...
          </Button>
          <Button type="danger" loading>
            Deleting project...
          </Button>
        </div>
      </div>
    </div>
  )
}
