import { Meta } from '@storybook/react'
import { ScrollArea } from '@ui/components/shadcn/ui/scroll-area'
import { Separator } from '@ui/components/shadcn/ui/separator'
import * as React from 'react'

const meta: Meta = {
  title: 'shadcn/ScrollArea',
  component: ScrollArea,
}

export function Default() {
  const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.0-beta.${a.length - i}`)
  return (
    <ScrollArea className="h-72 w-48 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {tags.map((tag) => (
          <React.Fragment>
            <div className="text-sm" key={tag}>
              {tag}
            </div>
            <Separator className="my-2" />
          </React.Fragment>
        ))}
      </div>
    </ScrollArea>
  )
}

export default meta
