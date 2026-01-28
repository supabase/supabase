'use client'

import { Collapsible } from 'ui'
import { ChevronUp } from 'lucide-react'

export default function HowCalculated({
  title = 'How we calculated this',
  items,
}: {
  title?: string
  items: string[]
}) {
  return (
    <Collapsible>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="text-sm text-foreground-lighter hover:text-foreground flex items-center gap-2"
        >
          <ChevronUp className="data-open-parent:rotate-0 data-closed-parent:rotate-180 h-4 w-4 transition" />
          {title}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2">
        <ul className="text-sm text-foreground-lighter list-disc pl-5 space-y-1">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible>
  )
}
