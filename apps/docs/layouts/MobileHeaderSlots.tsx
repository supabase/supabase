'use client'

import { createContext, useContext, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

interface MobileHeaderSlots {
  tocSlot: HTMLElement | null
}

// the mobile header sits in the layout, above the page that knows the headings
export const MobileHeaderSlotsContext = createContext<MobileHeaderSlots>({ tocSlot: null })

export const MobileTocSlotPortal = ({ children }: PropsWithChildren) => {
  const { tocSlot } = useContext(MobileHeaderSlotsContext)
  return tocSlot ? createPortal(children, tocSlot) : null
}
