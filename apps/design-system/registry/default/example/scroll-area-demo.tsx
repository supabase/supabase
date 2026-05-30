import * as React from 'react'
import { ScrollArea, Separator } from 'ui'

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`)

export default function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4 divide-y divide-border">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <div key={tag} className="text-sm py-2">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
