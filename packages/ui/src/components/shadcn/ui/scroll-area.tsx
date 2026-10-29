'use client'

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import { useSyncExternalStore, type ComponentProps } from 'react'

import { cn } from '../../../lib/utils/cn'

type ScrollType = NonNullable<ScrollAreaPrimitive.ScrollAreaProps['type']>

let scrollType: ScrollType | undefined
let probe: HTMLDivElement | undefined
const listeners = new Set<() => void>()

const handleScrollTypeChange = () => {
  scrollType = undefined
  listeners.forEach((listener) => listener())
}

const getScrollType = (): ScrollType => {
  if (scrollType) return scrollType
  // jsdom has no matchmedia or resizeobserver. there is no cache here, so a test that adds a mock later still measures
  if (typeof window.matchMedia !== 'function' || typeof ResizeObserver === 'undefined') {
    return 'hover'
  }

  // the os sends no event for its scroll bar setting. a change resizes this probe's content box, so the observer sees it
  if (!probe) {
    probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll'
    // a box without overflow may keep its old scroll bar after the os setting changes, so the probe overflows
    probe.innerHTML = '<div style="height:100px"></div>'
    new ResizeObserver(handleScrollTypeChange).observe(probe)
    window.matchMedia('(hover: hover)').addEventListener('change', handleScrollTypeChange)
  }
  // react drops nodes it does not own when it renders the root again, for example after a hydration mismatch
  if (!probe.isConnected) document.body.append(probe)
  const { offsetWidth, clientWidth } = probe

  // classic scroll bars take layout width, overlay ones take none.
  // a touch pan cancels the pointer, so hover hides the bar mid-scroll
  if (offsetWidth > clientWidth) scrollType = 'auto'
  else if (window.matchMedia('(hover: hover)').matches) scrollType = 'hover'
  else scrollType = 'scroll'
  return scrollType
}

const subscribeToScrollType = (onChange: () => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const ScrollRoot = (props: ComponentProps<typeof ScrollAreaPrimitive.Root>) => {
  const type = useSyncExternalStore<ScrollType>(subscribeToScrollType, getScrollType, () => 'hover')

  return <ScrollAreaPrimitive.Root type={type} {...props} />
}

const ScrollArea = ({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Root>) => (
  <ScrollRoot className={cn('relative overflow-hidden', className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollRoot>
)

const ScrollViewport = ({
  className,
  children,
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.Viewport>) => (
  <ScrollAreaPrimitive.Viewport className={cn('size-full rounded-[inherit]', className)} {...props}>
    {children}
  </ScrollAreaPrimitive.Viewport>
)

const ScrollBar = ({
  className,
  orientation = 'vertical',
  ...props
}: ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    orientation={orientation}
    className={cn(
      'flex touch-none select-none before:absolute before:rounded-full before:bg-foreground-muted/15',
      orientation === 'vertical' &&
        'h-full w-2.5 py-1.5 pr-1.5 before:inset-y-1.5 before:right-1.5 before:w-1',
      orientation === 'horizontal' &&
        'h-2.5 px-1.5 pb-1.5 before:inset-x-1.5 before:bottom-1.5 before:h-1',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-foreground-muted/40 transition-colors hover:bg-foreground-muted/60 forced-color-adjust-none forced-colors:bg-[CanvasText]" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
)

export { ScrollArea, ScrollBar, ScrollRoot, ScrollViewport }
