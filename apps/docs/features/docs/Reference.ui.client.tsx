'use client'

import { useInView } from 'react-intersection-observer'

import { cn } from 'ui'

interface StickyHeaderProps {
  title?: string
  slug?: string
  /**
   * The URL that leads directly to this section
   */
  link?: string
  monoFont?: boolean
  /**
   * Whether the header updates the URL on scroll
   */
  scrollSpyHeader?: boolean
  /**
   * Whether the user-agent is a search-engine crawler
   */
  crawlerPage?: boolean
}

function StickyHeader({
  title,
  slug,
  link,
  monoFont = false,
  scrollSpyHeader = false,
  crawlerPage = false,
}: StickyHeaderProps) {
  const { ref } = useInView({
    threshold: 1,
    rootMargin: '0% 0% -50% 0%',
    onChange: (inView, entry) => {
      if (inView && scrollSpyHeader) {
        window.history.replaceState(null, '', link)
      }
    },
  })

  return (
    <>
      {crawlerPage ? (
        <h1>{title}</h1>
      ) : (
        <h2
          ref={ref}
          id={slug}
          className={cn(
            'max-w-xl',
            'text-2xl font-medium text-foreground',
            'mt-0',
            'scroll-mt-[calc(33px+2rem)] lg:scroll-mt-[calc(var(--header-height)+1px+4rem)]',
            monoFont && 'font-mono'
          )}
        >
          {title}
        </h2>
      )}
    </>
  )
}

export { StickyHeader }
export type { StickyHeaderProps }
