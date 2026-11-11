'use client'

import { Accordion as AccordionPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

export function FaqAnswer({ children }: { children: ReactNode }) {
  return (
    <AccordionPrimitive.Content
      forceMount
      className="group/faq text-sm transition-[visibility] duration-0 delay-150 data-[state=open]:delay-0 data-[state=closed]:invisible motion-reduce:delay-0"
    >
      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-150 ease-out group-data-[state=open]/faq:grid-rows-[1fr] motion-reduce:transition-none">
        <div className="min-h-0 overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  )
}
