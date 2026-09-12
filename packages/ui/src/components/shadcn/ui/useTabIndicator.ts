'use client'

import { useLayoutEffect, type RefObject } from 'react'

export const useTabIndicator = (listRef: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || !list.querySelector(':scope > [data-tab-indicator]')) return

    let cancelled = false

    const measure = () => {
      const trigger = list.querySelector<HTMLElement>(':scope > [role="tab"][data-state="active"]')
      if (cancelled) return
      if (!trigger) {
        delete list.dataset.tabIndicatorReady
        return
      }

      const styles = getComputedStyle(trigger)
      const paddingLeft = parseFloat(styles.paddingLeft) || 0
      const paddingRight = parseFloat(styles.paddingRight) || 0

      list.style.setProperty('--active-tab-left', `${trigger.offsetLeft + paddingLeft}px`)
      list.style.setProperty(
        '--active-tab-width',
        `${trigger.offsetWidth - paddingLeft - paddingRight}px`
      )
      if (list.dataset.tabIndicatorReady === undefined) {
        // makes the bar already sitting on the active tab rather than sliding in
        requestAnimationFrame(() => {
          if (!cancelled) list.dataset.tabIndicatorReady = ''
        })
      }
    }

    const resizes = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    const sync = () => {
      resizes?.disconnect()
      resizes?.observe(list)
      Array.from(list.children).forEach((child) => resizes?.observe(child))
      measure()
    }

    sync()

    const mutations =
      typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(sync)
    mutations?.observe(list, {
      attributes: true,
      attributeFilter: ['data-state'],
      subtree: true,
      childList: true,
    })

    // label widths shift when webfonts land
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      cancelled = true
      mutations?.disconnect()
      resizes?.disconnect()
      delete list.dataset.tabIndicatorReady
    }
  }, [listRef])
}
