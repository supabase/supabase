'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { frameworkTitles } from '@/config/docs'
import { useFramework } from '@/context/framework-context'

export function FrameworkQuickstart({ children }: { children: ReactNode }) {
  const { framework, setFramework } = useFramework()
  const tabStripRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const strip = tabStripRef.current
    const tab = activeTabRef.current
    if (!strip || !tab) return

    const stripBounds = strip.getBoundingClientRect()
    const tabBounds = tab.getBoundingClientRect()
    if (tabBounds.left < stripBounds.left) {
      strip.scrollLeft += tabBounds.left - stripBounds.left
    } else if (tabBounds.right > stripBounds.right) {
      strip.scrollLeft += tabBounds.right - stripBounds.right
    }
  }, [framework])

  return (
    <Tabs value={framework} onValueChange={setFramework} className="w-full">
      <div ref={tabStripRef} className="overflow-x-auto">
        <TabsList aria-label="Framework setup guides" className="w-max min-w-full gap-0">
          {Object.entries(frameworkTitles).map(([value, label]) => (
            <TabsTrigger
              key={value}
              ref={value === framework ? activeTabRef : undefined}
              value={value}
              className="shrink-0 px-3 py-3 text-xs font-medium data-[state=active]:border-brand"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  )
}

export function FrameworkQuickstartTab({
  value,
  children,
}: {
  value: string
  children: ReactNode
}) {
  return (
    <TabsContent value={value} className="mt-8 [&>h2]:sr-only">
      {children}
    </TabsContent>
  )
}

export function QuickstartStep({ number, children }: { number: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        'grid grid-cols-[1.75rem_minmax(0,1fr)] gap-4 border-t py-6',
        number === '1' && 'border-t-0 pt-0'
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full border font-mono text-xs text-foreground-lighter"
      >
        {number}
      </span>
      <div className="min-w-0 [&_h3]:m-0 [&_h3]:font-sans [&_h3]:text-sm [&_h3]:font-semibold [&_p]:mt-2! [&_p]:text-sm [&_p]:leading-6 [&_pre]:mt-4 [&_pre]:mb-0 [&_pre]:rounded-md [&_pre_code]:text-xs">
        {children}
      </div>
    </section>
  )
}
