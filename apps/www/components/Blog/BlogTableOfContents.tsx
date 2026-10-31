'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AnchorProvider, Toc, TOCItems, TocPrimitive, TOCScrollArea } from 'ui-patterns/Toc'
import type { TOCItemType } from 'ui-patterns/Toc/types'

interface Props {
  items: TOCItemType[]
}

function SuppressUntilFirstAnchor({
  items,
  children,
}: {
  items: TOCItemType[]
  children: ReactNode
}) {
  const [enabled, setEnabled] = useState(false)
  const anchors = TocPrimitive.useActiveAnchors()

  useEffect(() => {
    const firstId = items[0]?.url.split('#')[1]
    if (!firstId) return

    const el = document.getElementById(firstId)
    if (!el) return

    // Activate when the first heading is within the bottom half of the viewport,
    // anticipating navigation jumps that land the heading near the top
    const check = () => setEnabled(el.getBoundingClientRect().top <= window.innerHeight * 0.5)

    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [items])

  return (
    <TocPrimitive.ActiveAnchorContext.Provider value={enabled ? anchors : []}>
      {children}
    </TocPrimitive.ActiveAnchorContext.Provider>
  )
}

export function BlogTableOfContents({ items }: Props) {
  if (!items.length) return null

  return (
    <AnchorProvider toc={items} single>
      <SuppressUntilFirstAnchor items={items}>
        <Toc className="border-l">
          <TOCScrollArea className="ml-[-2px]">
            <div className="-ml-3">
              <TOCItems items={items} />
            </div>
          </TOCScrollArea>
        </Toc>
      </SuppressUntilFirstAnchor>
    </AnchorProvider>
  )
}
