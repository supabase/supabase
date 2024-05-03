import { type PropsWithChildren, type RefObject, useEffect, useRef, useState } from 'react'

import { cn } from 'ui'

import { useQuery } from '../api/hooks/queryHooks'

/**
 * Hacking around a bug in cmdk where the empty state will show even when there
 * are force-mounted items.
 */
const CommandEmpty = ({
  children,
  className,
  listRef,
  ...props
}: PropsWithChildren<{
  className?: string
  listRef: RefObject<HTMLDivElement | undefined>
}>) => {
  const query = useQuery()

  const [render, setRender] = useState(false)
  const timeoutHandle = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!query) setRender(false)
    timeoutHandle.current = setTimeout(() => {
      setRender(!listRef?.current?.querySelector('[cmdk-item]'))
    })

    return () => clearTimeout(timeoutHandle.current)
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
