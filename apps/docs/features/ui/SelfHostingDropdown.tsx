'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren, useMemo, useState } from 'react'

import { Collapsible_Shadcn_, CollapsibleContent_Shadcn_, CollapsibleTrigger_Shadcn_, cn } from 'ui'

import { REFERENCES, selfHostingServices } from '~/content/navigation.references'

export function SelfHostingDropdown({
  service,
  page,
  className,
}: {
  service: string
  page: 'config' | 'reference'
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const [defaultShownOption, ...defaultHiddenOptions] = useMemo(
    () => selfHostingServices.map((service) => REFERENCES[service]),
    []
  )

  return (
    <div className={cn('grid grid-cols-[1fr_min_content_min_content] gap-2', className)}>
      <Label href="/guides/self-hosting">Overview</Label>
      <Label className="col-start-1">
        {defaultShownOption.name.replace(/self-hosting\s+/i, '')}
      </Label>
      <Tag>Reference</Tag>
      {defaultShownOption.hasConfig !== false && <Tag>Config</Tag>}
      <Collapsible_Shadcn_
        open={open}
        onOpenChange={setOpen}
        className="col-span-3 grid grid-cols-subgrid gap-2"
      >
        {!open && <ExpandButton className="col-span-3" expanded={false} />}
        <CollapsibleContent_Shadcn_ className="col-span-3 grid grid-cols-subgrid gap-2">
          {defaultHiddenOptions.map((option) => {
            const name = option.name.replace(/self-hosting\s+/i, '')
            const isCurrent = name.toLowerCase() === service

            return (
              <>
                <Label className="col-start-1">{name}</Label>
                <Tag>Reference</Tag>
                {option.hasConfig !== false && <Tag>Config</Tag>}
              </>
            )
          })}
        </CollapsibleContent_Shadcn_>
        {open && <ExpandButton className="col-span-3" expanded={true} />}
      </Collapsible_Shadcn_>
    </div>
  )
}

function ExpandButton({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <CollapsibleTrigger_Shadcn_ asChild>
      <button className={cn('flex justify-center', className)}>
        <span className="sr-only">{expanded ? 'Show less' : 'Show more'}</span>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>
    </CollapsibleTrigger_Shadcn_>
  )
}

function Label({
  href,
  className,
  children,
}: PropsWithChildren<{ href?: string; className?: string }>) {
  const Component = href ? Link : 'span'

  return (
    <Component className={cn('text-sm text-foreground-light', className)} href={href}>
      {children}
    </Component>
  )
}

function Tag({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('border rounded-lg px-2', 'text-sm text-foreground-light', className)}>
      {children}
    </div>
  )
}
