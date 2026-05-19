'use client'

import React, { ComponentProps, useState } from 'react'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  cn,
} from 'ui'

type Type = 'default' | 'bordered'
type Align = 'left' | 'right'

type BaseAccordionProps = ComponentProps<typeof Accordion_Shadcn_>

export interface AccordionProps {
  children?: React.ReactNode
  className?: string
  defaultActiveId?: (string | number)[]
  onChange?: (item: string | string[]) => void
  openBehaviour: 'single' | 'multiple'
  type?: Type
  defaultValue?: string | string[] | undefined
  justified?: Boolean
  chevronAlign?: Align
}

export function Accordion({
  children,
  className,
  onChange,
  openBehaviour = 'multiple',
  defaultValue = undefined,
  // All props below are ignored but kept to avoid impacting all docs pages
  type = 'default',
  justified = false,
  chevronAlign = 'right',
}: AccordionProps) {
  return (
    // @ts-expect-error: This is because the Radix component has 2 interfaces discriminated by its type prop. Safe to ignore
    <Accordion_Shadcn_
      type={openBehaviour}
      onValueChange={onChange}
      defaultValue={defaultValue}
      className={className}
    >
      {children}
    </Accordion_Shadcn_>
  )
}

interface ItemProps {
  children?: React.ReactNode
  className?: string
  header: React.ReactNode
  id: string
  icon?: React.ReactNode
  disabled?: boolean
}

export function AccordionItem({ children, className, header, id, disabled }: ItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <AccordionItem_Shadcn_
      value={id}
      // my-0 is required to avoid issues with the prose classes
      className={cn('*:my-0', className)}
      disabled={disabled}
      onClick={() => {
        setOpen(!open)
      }}
    >
      <AccordionTrigger_Shadcn_ className="text-sm">{header}</AccordionTrigger_Shadcn_>
      <AccordionContent_Shadcn_>{children}</AccordionContent_Shadcn_>
    </AccordionItem_Shadcn_>
  )
}
