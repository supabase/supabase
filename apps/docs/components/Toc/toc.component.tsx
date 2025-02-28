'use client'
import type { TOCItemType } from './server/get-toc'
import * as Primitive from './toc.ui-pattern'
import React, { type ComponentProps, type HTMLAttributes, type ReactNode, useRef } from 'react'
import { TocThumb } from './toc-thumb'
import { cn, ScrollArea, ScrollViewport } from 'ui'

export interface TOCProps {
  /**
   * Custom content in TOC container, before the main TOC
   */
  header?: ReactNode

  /**
   * Custom content in TOC container, after the main TOC
   */
  footer?: ReactNode

  children: ReactNode
}

export function Toc(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id="nd-toc"
      {...props}
      className={cn(
        'sticky pl-0 top-[calc(var[(--fd-banner-height)]+var(--fd-nav-height))] h-(--fd-toc-height) pb-2 pt-12',
        'max-md:hidden',
        props.className
      )}
      style={
        {
          ...props.style,
          '--fd-toc-height': 'calc(100dvh - var(--fd-banner-height) - var(--fd-nav-height))',
        } as object
      }
    >
      <div className="flex h-full w-[--fd-toc-width] max-w-full flex-col gap-3 pe-4">
        {props.children}
      </div>
    </div>
  )
}

export function TocItemsEmpty() {
  return (
    <div className="rounded-lg border bg-fd-card p-3 text-xs text-fd-muted-foreground">
      No Headings
    </div>
  )
}

export function TOCScrollArea({
  isMenu,
  ...props
}: ComponentProps<typeof ScrollArea> & { isMenu?: boolean }) {
  const viewRef = useRef<HTMLDivElement>(null)

  return (
    <ScrollArea {...props} className={cn('flex flex-col ps-px', props.className)}>
      <Primitive.ScrollProvider containerRef={viewRef}>
        <ScrollViewport
          className={cn('relative min-h-0 text-sm', isMenu && 'mt-2 mb-4 mx-4 md:mx-6')}
          ref={viewRef}
        >
          {props.children}
        </ScrollViewport>
      </Primitive.ScrollProvider>
    </ScrollArea>
  )
}

export function TOCItems({ items }: { items: TOCItemType[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return <TocItemsEmpty />

  return (
    <>
      <TocThumb
        containerRef={containerRef}
        className="absolute start-0 mt-[--fd-top] h-[--fd-height] w-px bg-foreground transition-all"
      />
      <div ref={containerRef} className="flex flex-col border-s border-foreground/10">
        {items.map((item) => (
          <TOCItem key={item.url} item={item} />
        ))}
      </div>
    </>
  )
}

function TOCItem({ item }: { item: TOCItemType }) {
  return (
    <Primitive.TOCItem
      href={item.url}
      className={cn(
        'prose py-1.5 text-sm text-foreground-lighter transition-colors [overflow-wrap:anywhere] first:pt-0 last:pb-0 data-[active=true]:text-foreground',
        item.depth <= 2 && 'ps-3',
        item.depth === 3 && 'ps-6',
        item.depth >= 4 && 'ps-8'
      )}
    >
      {item.title}
    </Primitive.TOCItem>
  )
}
