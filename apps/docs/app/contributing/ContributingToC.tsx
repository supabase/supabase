'use client'

import { Menu } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useEffect, useState } from 'react'

import { useBreakpoint } from 'common'
import { cn, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

interface TocItem extends HTMLAttributes<HTMLElement> {
  label: string
  anchor: string
}

export function ContributingToc({ className }: { className?: string }) {
  const mobileToc = useBreakpoint('xl')
  const [tocItems, setTocItems] = useState<Array<TocItem>>([])

  useEffect(() => {
    const headings = [
      ...document.querySelectorAll('article.prose > h2,h3'),
    ] as Array<HTMLHeadingElement>
    const tocItems = headings
      .filter((heading) => !!heading.id)
      .map((heading) => ({
        label: heading.textContent.substring(0, heading.textContent.length - 1), // Remove ending `#`
        anchor: heading.id,
      }))
    setTocItems(tocItems)
  }, [])

  return mobileToc ? (
    <MobileToc
      items={tocItems}
      className={cn(
        '[--local-top-spacing:2rem]',
        'sticky top-[calc(var(--header-height)+var(--local-top-spacing))] right-8'
      )}
    />
  ) : (
    <TocBase
      items={tocItems}
      className={cn(
        '[--local-top-spacing:5rem]',
        'border-l thin-scrollbar overflow-y-auto px-2 hidden md:block',
        'col-span-3 self-start sticky',
        'top-[calc(var(--header-height)+1px+2rem)] max-h-[calc(100vh-var(--header-height)-3rem)]'
      )}
    />
  )
}

function MobileToc({ items, className }: { items: Array<TocItem>; className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ className={cn('border rounded p-2', className)}>
        <Menu />
        <span className="sr-only">
          {open ? 'Close table of contents' : 'Open table of contents'}
        </span>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="end" className="w-48">
        <TocBase items={items} />
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

function TocBase({ items, className }: { items: Array<TocItem>; className?: string }) {
  return (
    <nav aria-label="Table of contents" className={cn('text-foreground-lighter', className)}>
      <ul className="toc-menu list-none pl-5 text-[0.8rem] grid gap-2">
        {items.map((item) => (
          <li key={item.anchor} className="overflow-hidden truncate">
            <a href={`#${item.anchor}`}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
