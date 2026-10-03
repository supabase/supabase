'use client'

import { useEffect, useState, type PropsWithChildren, type RefObject } from 'react'
import { cn } from 'ui'

import { useQuery } from '../api/hooks/queryHooks'

const CommandMenuEmpty = ({
  children,
  className,
  listRef,
  ...props
}: PropsWithChildren<{
  className?: string
  /**
   * Reference to the div that contains the command item list in the DOM.
   *
   * Hacking around a bug in cmdk where the empty state will show even when
   * there are force-mounted items.
   */
  listRef: RefObject<HTMLDivElement | undefined>
}>) => {
  const query = useQuery()

  const [render, setRender] = useState(false)
  useEffect(() => {
    if (!query) {
      setRender(false)
      return
    }

    const node = listRef?.current
    const checkEmpty = () => setRender(!node?.querySelector('[cmdk-item]'))
    checkEmpty()

    if (!node) return
    // Some sections (e.g. live DB resource search results) populate
    // asynchronously after the query changes, so re-check whenever the list's
    // contents actually change rather than only once per keystroke.
    const observer = new MutationObserver(checkEmpty)
    observer.observe(node, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [query, listRef])

  return (
    render && (
      <div className={cn('py-6 text-center text-sm text-foreground-muted', className)} {...props}>
        {children}
      </div>
    )
  )
}

export { CommandMenuEmpty }
