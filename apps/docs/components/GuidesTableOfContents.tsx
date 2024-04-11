import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { cn, TAB_CHANGE_EVENT_NAME } from 'ui'
import { ExpandableVideo } from 'ui-patterns'

import { highlightSelectedTocItem } from '~/components/CustomHTMLElements/CustomHTMLElements.utils'
import useHash from '~/hooks/useHash'
import { useRerenderOnEvt } from '~/hooks/useManualRerender'
import { removeAnchor } from './CustomHTMLElements/CustomHTMLElements.utils'
import { Feedback } from './Feedback'

const formatSlug = (slug: string) => {
  // [Joshen] We will still provide support for headers declared like this:
  //    ## REST API {#rest-api-overview}
  // At least for now, this was a docusaurus thing.
  if (slug.includes('#')) return slug.split('#')[1]
  return slug
}

const formatTOCHeader = (content: string) => {
  let begin = false
  const res = []
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

const GuidesTableOfContents = ({
  className,
  overrideToc,
  video,
}: {
  className?: string
  overrideToc?: Array<{ text: string; link: string; level: number }>
  video?: string
}) => {
  const [tocList, setTocList] = useState([])
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
          const link = heading.querySelector('a').getAttribute('href')
          const level = heading.tagName === 'H2' ? 2 : 3
          return { text, link, level }
        })
      setTocList(newHeadings)
    })

    return () => clearTimeout(timeoutHandle)
    /**
     * window.location.href needed to recalculate toc when page changes,
     * useRerenderOnEvt below will guarantee rerender on change
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideToc, typeof window !== 'undefined' && window.location.href])

  useEffect(() => {
    if (hash && displayedList.length > 0) {
      highlightSelectedTocItem(hash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, JSON.stringify(displayedList)])

  /**
   * Displayed headings may change if the tab changes, so the table of contents
   * needs to rerender.
   */
  useRerenderOnEvt(TAB_CHANGE_EVENT_NAME)

  if (!displayedList.length) return

  const tocVideoPreview = `http://img.youtube.com/vi/${video}/0.jpg`

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
