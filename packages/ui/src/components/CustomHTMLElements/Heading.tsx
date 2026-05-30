'use client'

import { forwardRef, useCallback, type HTMLAttributes } from 'react'
import { useInView } from 'react-intersection-observer'

import {
  getAnchor,
  highlightSelectedTocItem,
  removeAnchor,
  unHighlightSelectedTocItems,
} from './CustomHTMLElements.utils'

interface Props extends HTMLAttributes<HTMLHeadingElement> {
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
 * (see: /pages/guides/cli/config.tsx)
 */
const Heading = forwardRef(
  ({ tag, customAnchor, children, ...props }: React.PropsWithChildren<Props>, forwardedRef) => {
    const HeadingTag = `${tag}` as any
    const anchor = customAnchor ? customAnchor : getAnchor(children, props)
    const link = `#${anchor}`

    const { ref: viewRef } = useInView({
      threshold: 1,
      rootMargin: '-20% 0% -35% 0px',
      onChange: (inView, entry) => {
        if (window.scrollY === 0) unHighlightSelectedTocItems()
        if (inView) highlightSelectedTocItem(entry.target.id)
      },
    })

    const combinedRef = useCallback(
      (elem: HTMLHeadingElement) => {
        viewRef(elem)
        if (typeof forwardedRef === 'function') {
          forwardedRef(elem)
        } else if (forwardedRef) {
          forwardedRef.current = elem
        }
      },
      [forwardedRef, viewRef]
    )

    return (
      <HeadingTag id={anchor} ref={combinedRef} className="group scroll-mt-24" {...props}>
        {removeAnchor(children)}
        {anchor && (
          <a
            href={link}
            className="ml-2 opacity-0 focus:opacity-100 group-hover:opacity-100 transition"
          >
            #
          </a>
        )}
      </HeadingTag>
    )
  }
)
Heading.displayName = 'Heading'

export default Heading
