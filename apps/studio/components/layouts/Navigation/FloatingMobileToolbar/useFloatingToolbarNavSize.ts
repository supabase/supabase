import { useLayoutEffect, useState } from 'react'

import type { NavSize } from './FloatingMobileToolbar.utils'

function measure(
  el: HTMLElement | null,
  setNavSize: React.Dispatch<React.SetStateAction<NavSize>>
) {
  if (!el) return
  const rect = el.getBoundingClientRect()
  setNavSize((prev) =>
    prev.width !== rect.width || prev.height !== rect.height
      ? { width: rect.width, height: rect.height }
      : prev
  )
}

export function useFloatingToolbarNavSize(
  navRef: React.RefObject<HTMLElement | null>,
  isSheetOpen: boolean
): NavSize {
  const [navSize, setNavSize] = useState<NavSize>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    measure(el, setNavSize)
    const ro = new ResizeObserver(() => measure(el, setNavSize))
    ro.observe(el)
    return () => ro.disconnect()
  }, [navRef])

  useLayoutEffect(() => {
    if (!isSheetOpen) return
    const raf = requestAnimationFrame(() => measure(navRef.current, setNavSize))
    return () => cancelAnimationFrame(raf)
  }, [isSheetOpen, navRef])

  return navSize
}
