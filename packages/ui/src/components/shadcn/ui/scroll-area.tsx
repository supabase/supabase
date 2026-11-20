'use client'

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'
import { useSyncExternalStore, type ComponentProps } from 'react'

import { cn } from '../../../lib/utils/cn'

type ScrollType = NonNullable<ScrollAreaPrimitive.ScrollAreaProps['type']>
type ScrollRootProps = Omit<ComponentProps<typeof ScrollAreaPrimitive.Root>, 'type'>

let scrollType: ScrollType | undefined
let probe: HTMLDivElement | undefined
const listeners = new Set<() => void>()

const getScrollType = (): ScrollType => {
  if (scrollType) return scrollType
  // jsdom has no resizeobserver. there is no cache here, so a test that adds a mock later still measures
  if (typeof ResizeObserver === 'undefined') return 'scroll'

  // the os sends no event for its scroll bar setting. a change resizes this probe's content box, so the observer sees it
  if (!probe) {
    probe = document.createElement('div')
    probe.style.cssText =
      'position:absolute;top:-9999px;width:50px;height:50px;overflow:scroll;visibility:hidden'
    // a box without overflow may keep its old scroll bar after the os setting changes, so the probe overflows
    probe.innerHTML = '<div style="height:100px"></div>'
    new ResizeObserver(() => {
      scrollType = undefined
      listeners.forEach((listener) => listener())
    }).observe(probe)
  }
  // react drops nodes it does not own when it renders the root again, for example after a hydration mismatch
  if (!probe.isConnected) document.body.append(probe)

  // classic scroll bars take layout width, overlay ones take none
  scrollType = probe.offsetWidth > probe.clientWidth ? 'auto' : 'scroll'
  return scrollType
}

const subscribeToScrollType = (onChange: () => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const ScrollRoot = ({ className, ...props }: ScrollRootProps) => {
  const type = useSyncExternalStore<ScrollType>(
    subscribeToScrollType,
    getScrollType,
    () => 'scroll'
  )

  return (
    <ScrollAreaPrimitive.Root
      type={type}
      className={cn('group/scroll-area overflow-hidden', className)}
      {...props}
    />
  )
}

const ScrollArea = ({ children, ...props }: ScrollRootProps) => (
  <ScrollRoot {...props}>
    <ScrollViewport>{children}</ScrollViewport>
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
  // radix hover mode ignores scroll. forcemount keeps the bar mounted, so css shows it on hover and scroll mode shows it on scroll
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    forceMount
    orientation={orientation}
    className={cn(
      'flex touch-none select-none empty:hidden pointer-events-none opacity-0 transition-opacity data-[state=visible]:pointer-events-auto data-[state=visible]:opacity-100 group-hover/scroll-area:pointer-events-auto group-hover/scroll-area:opacity-100 group-has-[:focus-visible]/scroll-area:opacity-100 before:absolute before:rounded-full before:bg-tertiary-foreground/15',
      orientation === 'vertical' &&
        'h-full w-2.5 py-1.5 pr-1.5 before:inset-y-1.5 before:right-1.5 before:w-1',
      orientation === 'horizontal' &&
        'h-2.5 flex-col px-1.5 pb-1.5 before:inset-x-1.5 before:bottom-1.5 before:h-1',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-tertiary-foreground/40 transition-colors hover:bg-tertiary-foreground/60 forced-color-adjust-none forced-colors:bg-[CanvasText]" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
)

export { ScrollArea, ScrollBar, ScrollRoot, ScrollViewport }
