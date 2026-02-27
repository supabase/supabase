'use client'

import { useEffect, useState, type PropsWithChildren, type RefObject } from 'react'
import { cn } from 'ui'

import { useQuery } from '../api/hooks/queryHooks'

const CommandEmpty = ({
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
    if (!query) return setRender(false)
    setRender(!listRef?.current?.querySelector('[cmdk-item]'))
  }, [query])

  return (
    render && (
      <div className={cn('py-6 text-center text-sm text-foreground-muted', className)} {...props}>
        {children}
      </div>
    )
  )
}

export { CommandEmpty }
