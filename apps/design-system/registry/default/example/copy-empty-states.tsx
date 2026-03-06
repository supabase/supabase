'use client'

import { Key } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'

export default function CopyEmptyStates() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-col gap-4">
          <EmptyStatePresentational
            icon={Key}
            title="There are no API keys available"
            description=""
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-col gap-4">
          <EmptyStatePresentational
            icon={Key}
            title="No API keys"
            description="Generate a key to connect your application."
          >
            <Button type="primary">Generate key</Button>
          </EmptyStatePresentational>
        </div>
      </div>
    </div>
  )
}
