'use client'

import { useCallback, useMemo, type FC } from 'react'

import { useSticky } from './useStickyTabs.utils'

export type UseStickyTabsOptions = { scrollMarginTop?: string; style?: CSSStyleDeclaration }

export const useStickyTabs = (options?: UseStickyTabsOptions) => {
  const enabled = !!options
  const { scrollMarginTop, style } = options || {}
  const { inView, observedRef, stickyRef } = useSticky<HTMLDivElement>({
    enabled,
    style,
  })

  const onTabSelected = useCallback(() => {
    if (enabled && inView && stickyRef.current) {
      let elem = stickyRef.current as Element | null
      while (elem && !elem.matches('[role="tabpanel"][data-state="active"]')) {
        elem = elem.nextElementSibling
      }
      if (!elem) return

      const top = elem.getBoundingClientRect().top
      ;(elem as HTMLElement).style.scrollMarginTop = scrollMarginTop || '0px'
      if (top < 0) {
        elem.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: no-preference)').matches
            ? 'smooth'
            : 'instant',
        })
      }
    }
  }, [enabled, inView, scrollMarginTop, stickyRef])

  return useMemo(
    () => ({
      observedRef,
      stickyRef,
      onTabSelected,
    }),
    [observedRef, stickyRef, onTabSelected]
  )
}
