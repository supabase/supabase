'use client'

import { createContext, useCallback, useContext, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

interface MobileHeaderSlots {
  tocSlot: HTMLElement | null
  onTitleScroll?: (title: string | null) => void
}

// the mobile header sits in the layout, above the page that knows the headings and the title
export const MobileHeaderSlotsContext = createContext<MobileHeaderSlots>({ tocSlot: null })

export const MobileTocSlotPortal = ({ children }: PropsWithChildren) => {
  const { tocSlot } = useContext(MobileHeaderSlotsContext)
  return tocSlot ? createPortal(children, tocSlot) : null
}

// placed inside the page title's element, it tells the header when that element scrolls under it
export const PageTitleObserver = ({ title }: { title: string }) => {
  const { onTitleScroll } = useContext(MobileHeaderSlotsContext)

  const observeTitle = useCallback(
    (marker: HTMLSpanElement | null) => {
      const titleElement = marker?.parentElement
      if (!titleElement || !onTitleScroll) return

      const observer = new IntersectionObserver(
        ([entry]) => onTitleScroll(entry.isIntersecting ? null : title),
        // -90px is the header plus the toc bar, so the title counts as hidden under them
        { rootMargin: '-90px 0px 0px 0px' }
      )
      observer.observe(titleElement)
      return () => {
        observer.disconnect()
        onTitleScroll(null)
      }
    },
    [title, onTitleScroll]
  )

  return <span ref={observeTitle} hidden />
}
