'use client'

import { useEffect, useState, type PropsWithChildren, type RefObject } from 'react'
import { cn } from 'ui'

import { useCommands } from '../api/hooks/commandsHooks'
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
  // Re-check when sections are registered or removed after the query changed,
  // e.g. search results that load asynchronously
  const commandSections = useCommands()

  const [render, setRender] = useState(false)
  useEffect(() => {
    if (!query) return setRender(false)
    setRender(!listRef?.current?.querySelector('[cmdk-item]'))
  }, [query, commandSections])

  return (
    render && (
      <div className={cn('py-6 text-center text-sm text-foreground-muted', className)} {...props}>
        {children}
      </div>
    )
  )
}

export { CommandMenuEmpty }
