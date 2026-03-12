'use client'

import { PropsWithChildren, useCallback, type FC } from 'react'
import { type TabsProps } from 'ui/src/components/Tabs'

import { useSticky } from './withSticky.utils'

interface StickyProps {
  stickyTabList?: {
    scrollMarginTop?: string
    style?: CSSStyleDeclaration
  }
}

/**
 * Wrapper around Tabs to make the tab list sticky while the tab content is in
 * view.
 */
const withSticky =
  <Props extends PropsWithChildren<TabsProps>>(
    Component: FC<Omit<Props, 'stickyTabList' | 'onClick'>>
  ) =>
  ({ stickyTabList, onClick, ...props }: Props & StickyProps) => {
    const { inView, observedRef, stickyRef } = useSticky<HTMLDivElement>({
      enabled: !!stickyTabList,
      style: stickyTabList?.style,
    })

    const onClickInternal = useCallback(
      (id: string) => {
        if (stickyTabList && inView && stickyRef.current) {
          let elem = stickyRef.current as Element | null
          while (elem && !elem.matches('[role="tabpanel"][data-state="active"]')) {
            elem = elem.nextElementSibling
          }
          if (!elem) return

          const top = elem.getBoundingClientRect().top
          ;(elem as HTMLElement).style.scrollMarginTop = stickyTabList?.scrollMarginTop || '0px'
          if (top < 0) {
            elem.scrollIntoView({
              behavior: window.matchMedia('(prefers-reduced-motion: no-preference)').matches
                ? 'smooth'
                : 'instant',
            })
          }
        }

        onClick?.(id)
      },
      [!!stickyTabList, inView, onClick]
    )

    return (
      <Component
        {...props}
        onClick={onClickInternal}
        refs={{ base: observedRef, list: stickyRef }}
      />
    )
  }

export { withSticky }
