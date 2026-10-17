'use client'

import { ChevronRight } from 'lucide-react'
import {
  Fragment,
  useRef,
  type ComponentProps,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cn, removeAnchor, ScrollArea, ScrollViewport } from 'ui'

import type { TOCItemType } from './server/get-toc'
import * as Primitive from './toc-primitive'
import { TocThumb } from './toc-thumb'

export interface TOCProps {
  header?: ReactNode
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

export function TocDisclosure({ items, className }: { items: TOCItemType[]; className?: string }) {
  if (items.length === 0) return null

  // close once a heading is picked so the list doesn't stay open behind the jump
  const handleLinkClick = (event: MouseEvent<HTMLDetailsElement>) => {
    if (event.target instanceof Element && event.target.closest('a')) {
      event.currentTarget.open = false
    }
  }

  return (
    <details
      onClick={handleLinkClick}
      className={cn(
        'group not-prose overflow-hidden rounded-lg border border-default bg-surface-100',
        'has-[summary:focus-visible]:outline-2 has-[summary:focus-visible]:-outline-offset-2 has-[summary:focus-visible]:outline-ring',
        className
      )}
    >
      <summary
        className={cn(
          'flex min-h-8 cursor-pointer select-none items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase text-foreground-light',
          'transition-[background-color,color] duration-150 ease-out hover:bg-surface-200 hover:text-foreground',
          'focus-visible:outline-none [&::-webkit-details-marker]:hidden'
        )}
      >
        On this page
        <ChevronRight
          aria-hidden
          strokeWidth={2}
          className="ms-auto size-3 shrink-0 text-foreground-muted transition-transform duration-200 ease-out group-open:rotate-90 motion-reduce:transition-none"
        />
      </summary>
      <ul
        className={cn(
          'm-0 list-none border-t border-default px-3 py-2 text-sm leading-6',
          // links carry the spacing as padding so the gaps between them stay clickable, a parent's bottom gap moves to its first child
          '[&>li>a:has(+ul)]:pb-0'
        )}
      >
        {toTocTree(items).map(({ item, children }) => (
          <li key={item.url}>
            <TocDisclosureLink item={item} />
            {children.length > 0 ? (
              <ul
                className={cn(
                  'relative m-0 list-none p-0 pl-5 [&>li]:relative [&>li:last-child>a]:pb-2',
                  // border-muted flattened onto the box so the spine and elbow can meet without a darker overlap
                  '[--toc-line:color-mix(in_oklab,oklch(from_var(--border-muted)_l_c_h/1)_8%,var(--background-surface-100))]',
                  "[&>li]:before:absolute [&>li]:before:-left-4.5 [&>li]:before:top-0 [&>li]:before:h-4 [&>li]:before:w-3.5 [&>li]:before:rounded-bl-md [&>li]:before:border-b [&>li]:before:border-l [&>li]:before:border-(--toc-line) [&>li]:before:content-['']",
                  "[&>li:not(:last-child)]:after:absolute [&>li:not(:last-child)]:after:-left-4.5 [&>li:not(:last-child)]:after:top-2.5 [&>li:not(:last-child)]:after:bottom-0 [&>li:not(:last-child)]:after:w-px [&>li:not(:last-child)]:after:bg-(--toc-line) [&>li:not(:last-child)]:after:content-['']"
                )}
              >
                {children.map((child) => (
                  <li key={child.url}>
                    <TocDisclosureLink item={child} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  )
}

function TocDisclosureLink({ item }: { item: TOCItemType }) {
  return (
    <a
      href={`#${formatSlug(item.url)}`}
      className="block rounded-sm py-1 text-foreground-lighter wrap-anywhere hover:text-foreground focus-ring"
    >
      <TOCTitle title={item.title} />
    </a>
  )
}

interface TocTreeNode {
  item: TOCItemType
  children: TOCItemType[]
}

// level 3 headings hang off the level 2 heading before them, leading level 3s stay top level
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
    <Fragment key={index}>
      {x.type === 'code' ? <code className="text-code-inline">{x.value}</code> : x.value}
    </Fragment>
  ))
}
