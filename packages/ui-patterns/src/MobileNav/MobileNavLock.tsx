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

      const inerted = markInertOutside([toggle.closest('nav') ?? toggle, drawer])
      const root = document.documentElement
      const overflow = root.style.overflow
      root.style.overflow = 'hidden'
      // the toggle owns the open state, so escape presses it
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return
        toggle.click()
        toggle.focus()
      }
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        for (const element of inerted) element.removeAttribute('inert')
        root.style.overflow = overflow
        document.removeEventListener('keydown', handleKeyDown)
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
