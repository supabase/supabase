'use client'

import { Menu } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useEffect, useState } from 'react'

import { useBreakpoint } from 'common'
import { cn, Separator, Sheet, SheetContent, SheetHeader, SheetTrigger } from 'ui'
import { Feedback } from '~/components/Feedback'

interface TocItem extends HTMLAttributes<HTMLElement> {
  label: string
  anchor: string
}

export function ContributingToc({ className }: { className?: string }) {
  const mobileToc = useBreakpoint('xl')
  const [tocItems, setTocItems] = useState<Array<TocItem>>([])

  useEffect(() => {
    const headings = [
      ...document.querySelectorAll('article.prose > h2,h3:not(#feedback-title)'),
    ] as Array<HTMLHeadingElement>
    const tocItems = headings
      .filter((heading) => !!heading.id && heading.textContent)
      .map((heading) => ({
        label: heading.textContent!.substring(0, heading.textContent!.length - 1), // Remove ending `#`
        anchor: heading.id,
      }))
    setTocItems(tocItems)
  }, [])

  return mobileToc ? (
    <MobileToc items={tocItems} />
  ) : (
    <TocBase
      items={tocItems}
      className={cn(
        '[--local-top-spacing:5rem]',
        'border-l thin-scrollbar overflow-y-auto px-2 hidden lg:block',
        'col-span-3 self-start sticky',
        'top-[calc(var(--header-height)+1px+2rem)] max-h-[calc(100vh-var(--header-height)-3rem)]',
        className
      )}
    />
  )
}

function MobileToc({ items, className }: { items: Array<TocItem>; className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onHashChanged = () => setOpen(false)

    window.addEventListener('hashchange', onHashChanged)
    return () => {
      window.removeEventListener('hashchange', onHashChanged)
    }
  }, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          'fixed z-0 inset-0 top-auto w-full rounded-t-lg border border-b-0 p-4 bg-studio flex items-center gap-2 text-foreground-light text-sm',
          className
        )}
      >
        <Menu size={16} strokeWidth={1.5} className="text-foreground-light" />
        <span className="sr-only">
          {open ? 'Close table of contents' : 'Open table of contents'}
        </span>
        <span>On this page</span>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        size="lg"
        className={cn(
          'w-full flex flex-col gap-0 p-0 rounded-t-lg overflow-hidden',
          !open && 'top-[calc(100vh-100px)]'
        )}
      >
        <SheetHeader className="py-0 px-4">
          <SheetTrigger
            className={cn(
              'w-full py-4 flex items-center gap-2 text-foreground-light text-sm',
              className
            )}
          >
            <Menu size={16} strokeWidth={1.5} className="text-foreground-light" />
            <span className="sr-only">
              {open ? 'Close table of contents' : 'Open table of contents'}
            </span>
            <span>On this page</span>
          </SheetTrigger>
        </SheetHeader>
        <div className="w-full flex-1 p-4 pb-8 overflow-y-auto thin-scrollbar">
          <TocBase items={items} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function TocBase({ items, className }: { items: Array<TocItem>; className?: string }) {
  return (
    <nav aria-label="Table of contents" className={cn('text-foreground-lighter', className)}>
      <span className="hidden lg:block font-mono text-xs uppercase text-foreground px-5 mb-6">
        On this page
      </span>
      <ul className="toc-menu list-none lg:pl-5 text-[0.8rem] grid gap-2">
        {items.map((item) => (
          <li key={item.anchor} className="overflow-hidden truncate">
            <a href={`#${item.anchor}`}>{item.label}</a>
          </li>
        ))}
      </ul>
      <Separator className="lg:w-[calc(100%-2rem)] lg:ml-5 my-4 lg:my-8" />
      <Feedback className="pl-0 lg:pl-5" />
    </nav>
  )
}
