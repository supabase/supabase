'use client'

import { useLayoutEffect, type RefObject } from 'react'

type IndicatorOptions = {
  /** Selector for the active item, matched against direct children of the list. */
  activeItemSelector?: string
  /** Selector for the indicator element. The hook is a no-op when it is absent. */
  indicatorSelector?: string
  /** `dataset` key set on the list once a first measurement has landed. */
  readyFlag?: string
  /** Custom properties written on the list. */
  leftProperty?: string
  widthProperty?: string
  /**
   * Whether to shrink the measurement to the item's text box. True for an underline that
   * should span the label only, false for a fill that should cover the whole item.
   */
  insetByPadding?: boolean
}

const tabDefaults = {
  activeItemSelector: '[role="tab"][data-state="active"]',
  indicatorSelector: '[data-tab-indicator]',
  readyFlag: 'tabIndicatorReady',
  leftProperty: '--active-tab-left',
  widthProperty: '--active-tab-width',
  insetByPadding: true,
} satisfies Required<IndicatorOptions>

export const useTabIndicator = (
  listRef: RefObject<HTMLElement | null>,
  options: IndicatorOptions = {}
) => {
  const {
    activeItemSelector,
    indicatorSelector,
    readyFlag,
    leftProperty,
    widthProperty,
    insetByPadding,
  } = { ...tabDefaults, ...options }

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || !list.querySelector(`:scope > ${indicatorSelector}`)) return

    let cancelled = false

    const measure = () => {
      const trigger = list.querySelector<HTMLElement>(`:scope > ${activeItemSelector}`)
      if (cancelled) return
      if (!trigger) {
        delete list.dataset[readyFlag]
        return
      }

      const styles = getComputedStyle(trigger)
      const paddingLeft = insetByPadding ? parseFloat(styles.paddingLeft) || 0 : 0
      const paddingRight = insetByPadding ? parseFloat(styles.paddingRight) || 0 : 0

      list.style.setProperty(leftProperty, `${trigger.offsetLeft + paddingLeft}px`)
      list.style.setProperty(widthProperty, `${trigger.offsetWidth - paddingLeft - paddingRight}px`)
      if (list.dataset[readyFlag] === undefined) {
        // makes the bar already sitting on the active tab rather than sliding in
        requestAnimationFrame(() => {
          if (!cancelled) list.dataset[readyFlag] = ''
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
      delete list.dataset[readyFlag]
    }
  }, [
    listRef,
    activeItemSelector,
    indicatorSelector,
    readyFlag,
    leftProperty,
    widthProperty,
    insetByPadding,
  ])
}
