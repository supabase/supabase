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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  const tabListRef = useRef<HTMLDivElement>(null)

  const handleSelect = (id: string) => {
    setSelected(examples.find((example) => example.id === id) ?? examples[0])
    setOpen(false)
    tabListRef.current
      ?.querySelector(`[data-example-id="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  if (examples.length === 1) {
    return <div className={className}>{selected.content}</div>
  }

  return (
    <Tabs
      value={selected.id}
      onValueChange={handleSelect}
      className={cn(
        '[&_.shiki:first-child]:rounded-t-none [&_.shiki:first-child]:border-t-0',
        className
      )}
    >
      <div
        className={cn(
          'flex items-stretch overflow-hidden',
          'relative z-1',
          'rounded-t-lg border border-b-0 border-default bg-surface-75'
        )}
      >
        <TabsList
          ref={tabListRef}
          className={cn(
            'min-w-0 items-stretch border-0',
            'overflow-x-auto overscroll-x-none [scrollbar-width:none]'
          )}
        >
          {examples.map((example) => (
            <TabsTrigger
              key={example.id}
              value={example.id}
              data-example-id={example.id}
              className={cn(
                'shrink-0 px-3 py-2 text-xs transition-[color]',
                'border-b border-r last-of-type:border-r-0 border-default',
                'data-[state=active]:border-default data-[state=active]:border-b-transparent',
                'data-[state=active]:bg-200 data-[state=active]:shadow-none',
                'focus-visible:ring-inset focus-visible:ring-offset-0'
              )}
            >
              {example.name}
            </TabsTrigger>
          ))}
          <span
            aria-hidden
            className="sticky right-0 w-px shrink-0 bg-surface-75 shadow-[inset_-1px_0_0_var(--border)]"
          />
        </TabsList>
        <div className="flex flex-1 justify-end border-b border-default">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <ComboboxTrigger
                className={cn(
                  'h-full w-auto gap-0 rounded-none border-0 bg-transparent px-2',
                  '[&_svg]:transition-colors hover:[&_svg]:text-foreground',
                  'data-[state=open]:[&_svg]:text-foreground',
                  'focus-visible:ring-inset focus-visible:ring-offset-0'
                )}
              >
                <span className="sr-only">Select example</span>
              </ComboboxTrigger>
            </PopoverTrigger>
            <PopoverContent align="end" className="z-40 w-max min-w-56 max-w-xs p-0">
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
        </div>
      </div>
      <TabsContent value={selected.id} tabIndex={-1} className="mt-0">
        {selected.content}
      </TabsContent>
    </Tabs>
  )
}
