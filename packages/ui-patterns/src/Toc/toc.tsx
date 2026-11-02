'use client'

import { Fragment, useRef, type ComponentProps, type HTMLAttributes, type ReactNode } from 'react'
import { cn, removeAnchor, ScrollArea, ScrollViewport } from 'ui'

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
      className={cn('sticky top-(--header-height) h-fit max-md:hidden', props.className)}
      style={
        {
          ...props.style,
        } as object
      }
    >
      <div className="flex h-fit w-(--toc-width) max-w-full flex-col gap-3 pe-4">
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

export function TocSection({ items, className }: { items: TOCItemType[]; className?: string }) {
  return (
    <Toc className={cn('-ml-[calc(0.25rem+6px)]', className)}>
      <h3 className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-foreground pl-7.5">
        On this page
      </h3>
      <TOCScrollArea>
        <TOCItems items={items} />
      </TOCScrollArea>
    </Toc>
  )
}

export function TocTree({
  items,
  activeUrl,
  className,
}: {
  items: TOCItemType[]
  activeUrl?: string
  className?: string
}) {
  return (
    <ul className={cn('m-0 list-none text-sm leading-6', '[&>li>a:has(+ul)]:pb-0', className)}>
      {toTocTree(items).map(({ item, children }) => (
        <li key={item.url}>
          <TocTreeLink item={item} isActive={item.url === activeUrl} />
          {children.length > 0 ? (
            <ul
              className={cn(
                'relative m-0 list-none p-0 pl-5 [&>li]:relative',
                '[--toc-line:color-mix(in_oklab,oklch(from_var(--border-muted)_l_c_h/1)_8%,var(--background-surface-100))]',
                "[&>li]:before:absolute [&>li]:before:-left-4.5 [&>li]:before:top-0 [&>li]:before:h-5 [&>li]:before:w-3.5 [&>li]:before:rounded-bl-md [&>li]:before:border-b [&>li]:before:border-l [&>li]:before:border-(--toc-line) [&>li]:before:content-['']",
                "[&>li:not(:last-child)]:after:absolute [&>li:not(:last-child)]:after:-left-4.5 [&>li:not(:last-child)]:after:top-3.5 [&>li:not(:last-child)]:after:bottom-0 [&>li:not(:last-child)]:after:w-px [&>li:not(:last-child)]:after:bg-(--toc-line) [&>li:not(:last-child)]:after:content-['']"
              )}
            >
              {children.map((child) => (
                <li key={child.url}>
                  <TocTreeLink item={child} isActive={child.url === activeUrl} />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function TocTreeLink({ item, isActive }: { item: TOCItemType; isActive: boolean }) {
  return (
    <a
      href={`#${formatSlug(item.url)}`}
      aria-current={isActive ? 'location' : undefined}
      className="block rounded-sm py-2 text-foreground-lighter wrap-anywhere hover:text-foreground aria-[current=location]:text-foreground focus-ring"
    >
      <TOCTitle title={item.title} />
    </a>
  )
}

interface TocTreeNode {
  item: TOCItemType
  children: TOCItemType[]
}

// a level 3 heading goes under the level 2 heading before it. a level 3 heading with no level 2 before it stays at the top level
const toTocTree = (items: TOCItemType[]) =>
  items.reduce<TocTreeNode[]>((tree, item) => {
    const parent = tree.at(-1)
    if (item.depth === 3 && parent?.item.depth === 2) parent.children.push(item)
    else tree.push({ item, children: [] })
    return tree
  }, [])

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
        className="absolute inset-s-0 mt-(--toc-top) h-(--toc-height) w-px bg-foreground transition-all"
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
        'text-foreground-lighter hover:text-primary transition-colors py-1 wrap-anywhere first:pt-0 last:pb-0 data-[active=true]:text-foreground',
        item.depth <= 2 && 'ps-3',
        item.depth === 3 && 'ps-6',
        item.depth >= 4 && 'ps-8'
      )}
    >
      <TOCTitle title={item.title} />
    </Primitive.TOCItem>
  )
}

function TOCTitle({ title }: { title: TOCItemType['title'] }) {
  return formatTOCHeader(removeAnchor(title)).map((x, index) => (
    <Fragment key={index}>{x.type === 'code' ? <code>{x.value}</code> : x.value}</Fragment>
  ))
}
