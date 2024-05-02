import { type PropsWithChildren, type RefObject, useMemo, useState } from 'react'

import { cn } from 'ui'

import { useQuery } from '../api/hooks/queryHooks'

/**
 * Hacking a bug around cmdk where the empty state will show even when there
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
  useMemo(() => {
    if (!query) setRender(false)
    setTimeout(() => {
      setRender(!listRef?.current?.querySelector('[cmdk-item]'))
    })
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
