import { forwardRef, PropsWithChildren, useEffect, useRef } from 'react'
import { cn } from 'ui'

export const DataTableHeaderLayout = forwardRef<
  HTMLDivElement,
  PropsWithChildren<{
    setTopBarHeight: (height: number) => void
  }>
>(({ setTopBarHeight, ...props }, ref) => {
  const topBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rect = topBarRef.current?.getBoundingClientRect()
      if (rect) {
        setTopBarHeight(rect.height)
      }
    })

    const topBar = topBarRef.current
    if (!topBar) return

    observer.observe(topBar)
    return () => observer.unobserve(topBar)
  }, [topBarRef])

  return (
    <div
      ref={topBarRef}
      className={cn('flex flex-col gap-4 bg-background p-2', 'top-0 z-10 pb-4')}
      {...props}
    />
  )
})
DataTableHeaderLayout.displayName = 'DataTableHeaderLayout'
