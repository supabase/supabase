'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from 'ui'
import { ExpandableVideo } from 'ui-patterns/ExpandableVideo'
import { proxy, useSnapshot } from 'valtio'
import {
  highlightSelectedTocItem,
  removeAnchor,
} from 'ui/src/components/CustomHTMLElements/CustomHTMLElements.utils'
import { Feedback } from '~/components/Feedback'
import useHash from '~/hooks/useHash'

const formatSlug = (slug: string) => {
  // [Joshen] We will still provide support for headers declared like this:
  //    ## REST API {#rest-api-overview}
  // At least for now, this was a docusaurus thing.
  if (slug.includes('#')) return slug.split('#')[1]
  return slug
}

const formatTOCHeader = (content: string) => {
  let begin = false
  const res: Array<string> = []
  for (const x of content) {
    if (x === '`') {
      if (!begin) {
        begin = true
        res.push(`<code class="text-xs border rounded bg-muted">`)
      } else {
        begin = false
        res.push(`</code>`)
      }
    } else {
      res.push(x)
    }
  }
  return res.join('')
}

const tocRenderSwitch = proxy({
  renderFlag: 0,
  toggleRenderFlag: () => void (tocRenderSwitch.renderFlag = (tocRenderSwitch.renderFlag + 1) % 2),
})

const useSubscribeTocRerender = () => {
  const { renderFlag } = useSnapshot(tocRenderSwitch)
  return void renderFlag // Prevent it from being detected as unused code
}

const useTocRerenderTrigger = () => {
  const { toggleRenderFlag } = useSnapshot(tocRenderSwitch)
  return toggleRenderFlag
}

interface TOCHeader {
  id?: string
  text: string
  link: string
  level: number
}

const GuidesTableOfContents = ({
  className,
  overrideToc,
  video,
}: {
  className?: string
  overrideToc?: Array<TOCHeader>
  video?: string
}) => {
  useSubscribeTocRerender()
  const [tocList, setTocList] = useState<TOCHeader[]>([])
  const pathname = usePathname()
  const [hash] = useHash()

  const displayedList = overrideToc ?? tocList

  useEffect(() => {
    if (overrideToc) return

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
  }, [overrideToc, typeof window !== 'undefined' && window.location.href])

  useEffect(() => {
    if (hash && displayedList.length > 0) {
      highlightSelectedTocItem(hash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, JSON.stringify(displayedList)])

  if (!displayedList.length) return

  const tocVideoPreview = `https://img.youtube.com/vi/${video}/0.jpg`

  return (
    <div className={cn('border-l', 'thin-scrollbar overflow-y-auto', 'px-2', className)}>
      {video && (
        <div className="relative mb-6 pl-5">
          <ExpandableVideo imgUrl={tocVideoPreview} videoId={video} />
        </div>
      )}
      <Feedback key={pathname} />
      <span className="block font-mono text-xs uppercase text-foreground px-5 mb-6">
        On this page
      </span>
      <ul className="toc-menu list-none pl-5 text-[0.8rem] grid gap-2">
        {displayedList.map((item, i) => (
          <li key={`${item.level}-${i}`} className={item.level === 3 ? 'ml-4' : ''}>
            <a
              href={`#${formatSlug(item.link)}`}
              className="text-foreground-lighter hover:text-brand-link transition-colors"
              dangerouslySetInnerHTML={{ __html: formatTOCHeader(removeAnchor(item.text)) }}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default GuidesTableOfContents
export { useTocRerenderTrigger }
export type { TOCHeader }
