'use client'

import { Fragment, useRef, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react'
import { cn, ScrollArea, ScrollViewport } from 'ui'
import { removeAnchor } from 'ui/src/components/CustomHTMLElements/CustomHTMLElements.utils'

import type { TOCItemType } from './server/get-toc'
import * as Primitive from './toc-primitive'
import { TocThumb } from './toc-thumb'

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
      id="toc"
      {...props}
      className={cn('sticky top-[--header-height] h-fit max-md:hidden', props.className)}
      style={
        {
          ...props.style,
        } as object
      }
    >
      <div className="flex h-fit w-[--toc-width] max-w-full flex-col gap-3 pe-4">
        {props.children}
      </div>
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

  if (items.length === 0) return null

  return (
    <>
      <TocThumb
        containerRef={containerRef}
        className="absolute start-0 mt-[--toc-top] h-[--toc-height] w-px bg-foreground transition-all"
      />
      <div
        ref={containerRef}
        className={cn(
          'list-none text-[0.8rem] flex flex-col pl-[calc(0.75rem+5px)] border-foreground/10',
          showTrack && 'border-s'
        )}
      >
        {items.map((item) => (
          <TOCItem key={item.url} item={item} />
        ))}
      </div>
    </>
  )
}

const formatSlug = (slug: string) => {
  // [Joshen] We will still provide support for headers declared like this:
  //    ## REST API {#rest-api-overview}
  // At least for now, this was a docusaurus thing.
  if (slug.includes('#')) return slug.split('#')[1]
  return slug
}

function formatTOCHeader(content: string) {
  let insideInlineCode = false
  const res: Array<{ type: 'text'; value: string } | { type: 'code'; value: string }> = []

  for (const x of content) {
    if (x === '`') {
      if (!insideInlineCode) {
        insideInlineCode = true
        res.push({ type: 'code', value: '' })
      } else {
        insideInlineCode = false
      }
    } else {
      if (insideInlineCode) {
        res[res.length - 1].value += x
      } else {
        if (res.length === 0 || res[res.length - 1].type === 'code') {
          res.push({ type: 'text', value: x })
        } else {
          res[res.length - 1].value += x
        }
      }
    }
  }

  return res
}

function TOCItem({ item }: { item: TOCItemType }) {
  return (
    <Primitive.TOCItem
      href={`#${formatSlug(item.url)}`}
      className={cn(
        'text-foreground-lighter hover:text-brand-link transition-colors py-1 [overflow-wrap:anywhere] first:pt-0 last:pb-0 data-[active=true]:text-foreground',
        item.depth <= 2 && 'ps-3',
        item.depth === 3 && 'ps-6',
        item.depth >= 4 && 'ps-8'
      )}
    >
      {formatTOCHeader(removeAnchor(item.title)).map((x, index) => (
        <Fragment key={index}>
          {x.type === 'code' ? <code className="text-code-inline">{x.value}</code> : x.value}
        </Fragment>
      ))}
    </Primitive.TOCItem>
  )
}
