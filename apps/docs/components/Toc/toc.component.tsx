'use client'
import type { TOCItemType } from './server/get-toc'
import * as Primitive from './toc.ui-pattern'
import React, { type ComponentProps, type HTMLAttributes, type ReactNode, useRef } from 'react'
import { TocThumb } from './toc-thumb'
import { cn, ScrollArea, ScrollViewport } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

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
        'sticky top-[calc(var[(--fd-banner-height)]+var(--fd-nav-height))] h-(--fd-toc-height)',
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
    <div className="!pl-5 text-xs text-foreground-lighter flex flex-col gap-4">
      <ShimmeringLoader className="ml-2 h-2 w-20 p-0 rounded-sm" />
      <ShimmeringLoader className="ml-7 h-2 w-20 p-0 rounded-sm" />
      <ShimmeringLoader className="ml-7 h-2 w-14 p-0 rounded-sm" />
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

export function TOCItems({
  items,
  showTrack = false,
}: {
  items: TOCItemType[]
  showTrack?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return <TocItemsEmpty />

  return (
    <>
      <TocThumb
        containerRef={containerRef}
        className="absolute start-0 mt-[--fd-top] h-[--fd-height] w-px bg-foreground transition-all"
      />
      <div
        ref={containerRef}
        className={cn('flex flex-col pl-5 border-foreground/10', showTrack && 'border-s')}
      >
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
