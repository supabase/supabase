import { PropsWithChildren } from 'react'
import { useInView } from 'react-intersection-observer'
import {
  getAnchor,
  highlightSelectedTocItem,
  removeAnchor,
  unHighlightSelectedTocItems,
} from './CustomHTMLElements.utils'

/**
 * [Joshen] The trick with rootMargin
 * We are shrinking the top of the root element by 20 percent, which is currently our entire page,
 * and the bottom by 35 percent. Therefore, when a header is at the top 20 percent and bottom 35 percent
 * of our page, it will not be counted as visible.
 */

export interface HeadingProps {
  tag?: string
  parseAnchors?: boolean
  customAnchor?: string
}

/**
 * This TOC is used in .mdx files and in .tsx files.
 * In mdx files, we need to parse the content and format them to match the
 * expected tocList format (text, link,level).
 *
 * In tsx files, we can generate this tocList directly. For these files, we don't
 * need to parse the <a> and generate anchors. Custom anchors are used in tsx files.
 * (see: /pages/reference/cli/config.tsx)
 */
const Heading = ({ tag, customAnchor, children }: PropsWithChildren<HeadingProps>) => {
  const HeadingTag = `${tag}` as any
  const anchor = customAnchor ? customAnchor : getAnchor(children)
  const link = `#${anchor}`

  const { ref } = useInView({
    threshold: 1,
    rootMargin: '-20% 0% -35% 0px',
    onChange: (inView, entry) => {
      if (window.scrollY === 0) unHighlightSelectedTocItems()
      if (inView) highlightSelectedTocItem(entry.target.id)
    },
  })

  return (
    <HeadingTag id={anchor} ref={ref} className="group scroll-mt-24">
      {removeAnchor(children)}
      {anchor && (
        <a href={link} className="ml-2 opacity-0 group-hover:opacity-100 transition">
          #
        </a>
      )}
    </HeadingTag>
  )
}
export default Heading
