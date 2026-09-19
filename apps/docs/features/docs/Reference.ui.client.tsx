'use client'

import { ReferenceContentInitiallyScrolledContext } from '~/features/docs/Reference.navigation.client'
import { safeHistoryReplaceState } from '~/lib/historyUtils'
import { Check, XCircle } from 'lucide-react'
import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { useContext, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import {
  cn,
  CollapsibleTrigger,
  ComboboxTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'

import { type IApiEndPoint } from './Reference.api.utils'
import { API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES } from './Reference.ui.shared'

/**
 * Wrap a reference section with client-side functionality:
 *
 * - Intersection observer to auto-update the URL when the user scrolls the page
 * - An ID to scroll to programmatically. This is on the entire section rather
 *   than the heading to avoid problems with scroll-to position when the heading
 *   is sticky.
 */
export function ReferenceSectionWrapper({
  id,
  link,
  children,
  className,
}: PropsWithChildren<{ id: string; link: string; className?: string }> &
  HTMLAttributes<HTMLElement>) {
  const initialScrollHappened = useContext(ReferenceContentInitiallyScrolledContext)

  const { ref } = useInView({
    threshold: 0,
    rootMargin: '-10% 0% -50% 0%',
    onChange: (inView) => {
      if (
        inView &&
        initialScrollHappened &&
        window.scrollY > 0 /* Don't update on first navigation to introduction */
      ) {
        safeHistoryReplaceState(link)
      }
    },
  })

  return (
    <section
      ref={ref}
      id={id}
      className={cn('scroll-mt-[calc(var(--header-height)+4rem)]', className)}
    >
      {children}
    </section>
  )
}

export function ApiOperationBodySchemeSelector({
  requestBody,
  className,
}: {
  requestBody: IApiEndPoint['requestBody']
  className?: string
}) {
  const availableSchemes = Object.keys(requestBody?.content || {}) as Array<
    'application/json' | 'application/x-www-form-urlencoded'
  >
  const [selectedScheme, setSelectedScheme] = useState(availableSchemes[0])

  const containerRef = useRef<HTMLDivElement>(null)
  const allSchemeDetails = useRef<HTMLUListElement[]>([])
  useEffect(() => {
    const elements = containerRef.current?.querySelectorAll(
      `[${API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES.KEY}]`
    )
    allSchemeDetails.current = elements ? (Array.from(elements) as HTMLUListElement[]) : []
  }, [])

  useEffect(() => {
    allSchemeDetails.current?.forEach((schemeDetails) => {
      schemeDetails.hidden =
        schemeDetails.getAttribute(API_REFERENCE_REQUEST_BODY_SCHEMA_DATA_ATTRIBUTES.KEY) !==
        selectedScheme
    })
  }, [selectedScheme])

  return (
    <div ref={containerRef} className={cn('flex items-center justify-between gap-2', className)}>
      <h3 className="text-base text-foreground">Body</h3>
      <Select
        value={selectedScheme}
        onValueChange={(value) =>
          setSelectedScheme(value as 'application/json' | 'application/x-www-form-urlencoded')
        }
      >
        <SelectTrigger className="w-48 [&>span]:w-full [&>span]:truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableSchemes.map((scheme) => (
              <SelectItem key={scheme} value={scheme}>
                {scheme}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

export function DetailsTrigger({ label, className }: { label: string; className?: string }) {
  return (
    <CollapsibleTrigger className={cn('group reference-details-trigger', className)}>
      <XCircle size={14} aria-hidden="true" className="reference-details-trigger-icon" />
      {label}
    </CollapsibleTrigger>
  )
}

export function ExamplesCombobox({
  examples,
  className,
}: {
  examples: Array<{ id: string; name: string; content: ReactNode }>
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(examples[0])

  const handleSelect = (id: string) => {
    setSelected(examples.find((example) => example.id === id) ?? examples[0])
    setOpen(false)
  }

  if (examples.length === 1) {
    return <div className={className}>{selected.content}</div>
  }

  return (
    <div
      className={cn(
        '[&_.shiki:first-child]:rounded-t-none [&_.shiki:first-child]:border-t-0',
        className
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <div className="rounded-t-lg border border-default bg-200">
          <PopoverTrigger asChild>
            <ComboboxTrigger className="rounded-lg border-0 bg-transparent focus-visible:ring-inset focus-visible:ring-offset-0">
              {selected.name}
            </ComboboxTrigger>
          </PopoverTrigger>
        </div>
        <PopoverContent align="start" className="z-40 w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Search examples…" />
            <CommandList>
              <CommandEmpty>No example found</CommandEmpty>
              <CommandGroup>
                {examples.map((example) => (
                  <CommandItem
                    key={example.id}
                    value={example.id}
                    keywords={[example.name]}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        selected.id === example.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {example.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.content}
    </div>
  )
}
