'use client'

import { useCallback, type RefObject } from 'react'

export interface MobileNavLockProps {
  // the button that opens and closes the nav, inside the nav's header
  toggleRef: RefObject<HTMLElement | null>
}

// render it as a direct child of the open drawer. only the drawer and the header stay reachable, and the page does not scroll
export const MobileNavLock = ({ toggleRef }: MobileNavLockProps) => {
  const lockPage = useCallback(
    (marker: HTMLSpanElement | null) => {
      const toggle = toggleRef.current
      const drawer = marker?.parentElement
      if (!toggle || !drawer) return

      const regions = [toggle.closest('nav') ?? toggle, drawer]
      const inerted = markInertOutside(regions)
      const root = document.documentElement
      const overflow = root.style.overflow
      root.style.overflow = 'hidden'
      // the toggle owns the open state, so escape presses it.
      // a popup with focus is outside the regions, so it closes first. a closed layer elsewhere can set defaultPrevented.
      // a click on an empty part of the drawer moves focus to the body
      const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target
        if (event.key !== 'Escape') return
        const isFocusElsewhere =
          target instanceof Element &&
          target !== document.body &&
          !regions.some((region) => region.contains(target))
        if (isFocusElsewhere) return
        toggle.click()
        toggle.focus()
      }
      document.addEventListener('keydown', handleKeyDown)
      // an open nav keeps the page inert, so the nav closes at the lg breakpoint
      const desktop = window.matchMedia('(min-width: 64rem)')
      const handleDesktopChange = (event: MediaQueryListEvent) => {
        if (event.matches) toggle.click()
      }
      desktop.addEventListener('change', handleDesktopChange)

      return () => {
        for (const element of inerted) element.removeAttribute('inert')
        root.style.overflow = overflow
        document.removeEventListener('keydown', handleKeyDown)
        desktop.removeEventListener('change', handleDesktopChange)
      }
    },
    [toggleRef]
  )

  return <span ref={lockPage} hidden />
}

// returns only the elements it changed, so the cleanup keeps inert that other code set
const markInertOutside = (regions: Element[]): Element[] => {
  const changed: Element[] = []
  const visit = (parent: Element) => {
    for (const child of parent.children) {
      if (regions.includes(child)) continue
      if (regions.some((region) => child.contains(region))) {
        visit(child)
      } else if (!child.hasAttribute('inert')) {
        child.setAttribute('inert', '')
        changed.push(child)
      }
    }
  }
  visit(document.body)
  return changed
}
