'use client'

import { useEffect, useState, type PropsWithChildren } from 'react'
import { AnchorProvider } from 'ui-patterns'
import { TocAnchorsContext, useSubscribeTocRerender } from './GuidesMdx.state'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const TocAnchorsProvider = ({ children }: PropsWithChildren) => {
  const [tocList, setTocList] = useState<TOCHeader[]>([])
  useSubscribeTocRerender()

  const displayedList = tocList
  const toc = displayedList.map((item) => ({
    title: item.text,
    url: item.link,
    depth: item.level,
  }))

  useEffect(() => {
    /**
     * Because we're directly querying the DOM, needs the setTimeout so the DOM
     * update will happen first.
     */
    const timeoutHandle = setTimeout(() => {
      const headings = Array.from(
        document.querySelector('#sb-docs-guide-main-article')?.querySelectorAll('h2, h3') ?? []
      )

      const newHeadings = headings
        .filter((heading) => heading.id)
        .map((heading) => {
          const text = heading.textContent?.replace('#', '') || ''
          const link = heading.querySelector('a')?.getAttribute('href')
          if (!link) return null

          const level = heading.tagName === 'H2' ? 2 : 3

          return { text, link, level } as Partial<TOCHeader>
        })
        .filter((x): x is TOCHeader => !!x && !!x.text && !!x.link && !!x.level)
      setTocList(newHeadings)
    })

    return () => clearTimeout(timeoutHandle)
    /**
     * window.location.href needed to recalculate toc when page changes,
     * `useSubscribeTocRerender` above will trigger the rerender
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof window !== 'undefined' && window.location.href])

  return (
    <TocAnchorsContext.Provider value={{ toc }}>
      <AnchorProvider toc={toc} single={false}>
        {children}
      </AnchorProvider>
    </TocAnchorsContext.Provider>
  )
}

export { TocAnchorsProvider }
