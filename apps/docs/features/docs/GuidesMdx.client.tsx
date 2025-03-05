'use client'

import { proxy, useSnapshot } from 'valtio'

/**
 * The MDXProvider is necessary so that MDX partials will have access
 * to components.
 */

import { MDXProvider } from '@mdx-js/react'
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { components } from '~/features/docs/MdxBase.shared'
import { type AnchorProviderProps, AnchorProvider } from 'ui-patterns'

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const TocAnchorsContext = createContext<AnchorProviderProps | undefined>(undefined)

const useTocAnchors = () => {
  const context = useContext(TocAnchorsContext)
  if (!context) {
    throw new Error('useTocAnchors must be used within an TocAnchorsContext')
  }
  return context
}

const useTocRerenderTrigger = () => {
  const { toggleRenderFlag } = useSnapshot(tocRenderSwitch)
  return toggleRenderFlag
}

const tocRenderSwitch = proxy({
  renderFlag: 0,
  toggleRenderFlag: () => void (tocRenderSwitch.renderFlag = (tocRenderSwitch.renderFlag + 1) % 2),
})

const useSubscribeTocRerender = () => {
  const { renderFlag } = useSnapshot(tocRenderSwitch)
  return void renderFlag // Prevent it from being detected as unused code
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
          const text = heading.textContent.replace('#', '')
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

const MDXProviderGuides = ({ children }: PropsWithChildren) => {
  return <MDXProvider components={components}>{children}</MDXProvider>
}

export { MDXProviderGuides, TocAnchorsProvider, useTocAnchors, useTocRerenderTrigger }
