import Link from 'next/link'
import { Doc } from 'contentlayer/generated'
import { NavItem, NavItemWithChildren } from '@/types/nav'

import { docsConfig } from '@/config/docs'
import { cn } from '@/lib/utils'
import { buttonVariants } from 'ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DocsPagerProps {
  doc: Doc
}

export function DocsPager({ doc }: DocsPagerProps) {
  const pager = getPagerForDoc(doc)

  if (!pager) {
    return null
  }

  return (
    <div className="flex flex-row items-center justify-between">
      {pager?.prev?.href && (
        <Link
          href={pager.prev.href}
          className="flex gap-3 text-foreground-light hover:text-foreground group"
        >
          <ChevronLeft className="mr-2 h-4 w-4 self-end mb-1 text-foreground-muted group-hover:text-foreground-lighter" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-wider text-foreground-muted group-hover:text-foreground-lighter">
              Previous
            </span>
            {pager.prev.title}
          </div>
        </Link>
      )}
      {pager?.next?.href && (
        <Link
          href={pager.next.href}
          className="flex gap-3 text-foreground-light hover:text-foreground group"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-mono uppercase tracking-wider text-foreground-muted group-hover:text-foreground-lighter">
              Next
            </span>
            {pager.next.title}
          </div>
          <ChevronRight className="ml-2 h-4 w-4 self-end mb-1 text-foreground-muted group-hover:text-foreground-lighter" />
        </Link>
      )}
    </div>
  )
}

export function getPagerForDoc(doc: Doc) {
  const flattenedLinks = [null, ...flatten(docsConfig.sidebarNav), null]
  const activeIndex = flattenedLinks.findIndex((link) => doc.slug === link?.href)
  const prev = activeIndex !== 0 ? flattenedLinks[activeIndex - 1] : null
  const next = activeIndex !== flattenedLinks.length - 1 ? flattenedLinks[activeIndex + 1] : null
  return {
    prev,
    next,
  }
}

export function flatten(links: NavItemWithChildren[]): NavItem[] {
  return links
    .reduce<NavItem[]>((flat, link) => {
      return flat.concat(link.items?.length ? flatten(link.items) : link)
    }, [])
    .filter((link) => !link?.disabled)
}
