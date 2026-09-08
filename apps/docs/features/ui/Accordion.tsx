'use client'

import React, { useState } from 'react'
import {
  AccordionContent,
  AccordionTrigger,
  Accordion as BaseAccordion,
  AccordionItem as BaseAccordionItem,
  cn,
} from 'ui'

type Type = 'default' | 'bordered'
type Align = 'left' | 'right'

export interface AccordionProps {
  children?: React.ReactNode
  className?: string
  defaultActiveId?: (string | number)[]
  onChange?: (item: string | string[]) => void
  type?: Type
  defaultValue?: string[] | undefined
  justified?: Boolean
  chevronAlign?: Align
}

export function Accordion({
  children,
  className,
  onChange,
  defaultValue = undefined,
  // All props below are ignored but kept to avoid impacting all docs pages
  // type = 'default',
  // justified = false,
  // chevronAlign = 'right',
}: AccordionProps) {
  return (
    <BaseAccordion
      type="multiple"
      onValueChange={onChange}
      defaultValue={defaultValue}
      className={className}
    >
      {children}
    </BaseAccordion>
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
    <BaseAccordionItem
      value={id}
      // my-0 is required to avoid issues with the prose classes
      className={cn('*:my-0', className)}
      disabled={disabled}
      onClick={() => {
        setOpen(!open)
      }}
    >
      <AccordionTrigger className="text-sm">{header}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </BaseAccordionItem>
  )
}
