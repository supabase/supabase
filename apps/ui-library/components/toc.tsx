'use client'

import * as React from 'react'

import { TableOfContents } from '@/lib/toc'
import { cn } from '@/lib/utils'

interface TocProps {
  toc: TableOfContents
}

type TocItem = NonNullable<TableOfContents['items']>[number]

function getHeadingIds(items: TocItem[]): string[] {
  return items.flatMap((item) => [item.url.split('#')[1], ...getHeadingIds(item.items ?? [])])
}

export function DashboardTableOfContents({ toc }: TocProps) {
  const itemIds = React.useMemo(() => getHeadingIds(toc.items ?? []).filter(Boolean), [toc])
  const activeHeading = useActiveItem(itemIds)

  if (!toc.items?.length) return null

  return (
    <nav aria-label="On this page" className="text-xs">
      <Tree tree={toc} activeItem={activeHeading} />
    </nav>
  )
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = React.useState<string>()

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '0% 0% -80% 0%' }
    )

    itemIds.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [itemIds])

  return activeId
}

interface TreeProps {
  tree: TableOfContents
  level?: number
  activeItem?: string
}

function Tree({ tree, level = 1, activeItem }: TreeProps) {
  if (!tree.items?.length) return null

  return (
    <ul className={cn('m-0 list-none space-y-1', level !== 1 && 'mt-1 border-l pl-3')}>
      {tree.items.map((item) => (
        <li key={item.url}>
          <a
            href={item.url}
            aria-current={item.url === `#${activeItem}` ? 'location' : undefined}
            className={cn(
              'block py-1.5 leading-5 no-underline transition-colors hover:text-foreground',
              item.url === `#${activeItem}`
                ? 'font-medium text-foreground'
                : 'text-foreground-lighter'
            )}
          >
            {item.title}
          </a>
          <Tree tree={item} level={level + 1} activeItem={activeItem} />
        </li>
      ))}
    </ul>
  )
}
