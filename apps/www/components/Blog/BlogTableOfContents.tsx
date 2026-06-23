'use client'

import { AnchorProvider, Toc, TOCItems, TOCScrollArea } from 'ui-patterns'
import type { TOCItemType } from 'ui-patterns/Toc/types'

interface Props {
  items: TOCItemType[]
}

export function BlogTableOfContents({ items }: Props) {
  if (!items.length) return null

  return (
    <AnchorProvider toc={items} single>
      <Toc>
        <p className="text-foreground-lighter text-sm font-normal">On this page</p>
        <TOCScrollArea>
          <div className="-ml-[calc(0.75rem+5px)]">
            <TOCItems items={items} />
          </div>
        </TOCScrollArea>
      </Toc>
    </AnchorProvider>
  )
}
