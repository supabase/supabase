'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Scrolls to the section matching window.location.hash on mount and on
// pathname change. We render a mobile and a desktop row for each item, so the
// id-based anchors are suffixed with `-mobile` / `-desktop` and we pick the
// right one based on viewport width.
export default function HashAnchorScroll() {
  const pathname = usePathname()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return

    let device = 'desktop'
    if (window.matchMedia('screen and (max-width: 1024px)').matches) {
      device = 'mobile'
    }

    const element = document.querySelector(`#${hash}-${device}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pathname])

  return null
}
