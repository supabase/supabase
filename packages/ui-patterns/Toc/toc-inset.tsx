'use client'

import type { TOCItemType } from './server/get-toc'
import * as TocPrimitive from './toc-primitive'
import { useEffect, useRef, useState } from 'react'
import { TocThumb } from './toc-thumb'
import { TocItemsEmpty } from './toc'
import { cn } from 'ui'

export default function TocInsetItems({ items }: { items: TOCItemType[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const [svg, setSvg] = useState<{
    path: string
    width: number
    height: number
  }>()

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    function onResize(): void {
      if (container.clientHeight === 0) return
      let w = 0,
        h = 0
      const d: string[] = []
      for (let i = 0; i < items.length; i++) {
        const element: HTMLElement | null = container.querySelector(
          `a[href="#${items[i].url.slice(1)}"]`
        )

        if (!element) continue

        const styles = getComputedStyle(element)
        const offset = getLineOffset(items[i].depth) + 1,
          top = element.offsetTop + parseFloat(styles.paddingTop),
          bottom = element.offsetTop + element.clientHeight - parseFloat(styles.paddingBottom)

        w = Math.max(offset, w)
        h = Math.max(h, bottom)

        d.push(`${i === 0 ? 'M' : 'L'}${offset} ${top}`)
        d.push(`L${offset} ${bottom}`)
      }

      setSvg({
        path: d.join(' '),
        width: w + 1,
        height: h,
      })
    }

    const observer = new ResizeObserver(onResize)
    onResize()

    observer.observe(container)
    return () => {
      observer.disconnect()
    }
  }, [items])

  if (items.length === 0) return <TocItemsEmpty />

  return (
    <>
      {svg ? (
        <div
          className="absolute z-50 start-0 top-0 rtl:-scale-x-100"
          style={{
            width: svg.width,
            height: svg.height,
            maskImage: `url("data:image/svg+xml,${
              // Inline SVG
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svg.width} ${svg.height}"><path d="${svg.path}" stroke="white" stroke-width="1" fill="none" /></svg>`
              )
            }")`,
          }}
        >
          <TocThumb
            containerRef={containerRef}
            className="mt-[--fd-top] w-20 h-[--fd-height] bg-foreground transition-all"
          />
        </div>
      ) : null}
      <div className="flex flex-col" ref={containerRef}>
        {items.map((item, i) => (
          <TOCItem
            key={item.url}
            item={item}
            upper={items[i - 1]?.depth}
            lower={items[i + 1]?.depth}
          />
        ))}
      </div>
    </>
  )
}

function getItemOffset(depth: number): number {
  if (depth <= 2) return 14
  if (depth === 3) return 26
  return 36
}

function getLineOffset(depth: number): number {
  // Change values to inset line
  return depth >= 3 ? 0 : 0
}

function TOCItem({
  item,
  upper = item.depth,
  lower = item.depth,
}: {
  item: TOCItemType
  upper?: number
  lower?: number
}) {
  const offset = getLineOffset(item.depth),
    upperOffset = getLineOffset(upper),
    lowerOffset = getLineOffset(lower)

  return (
    <TocPrimitive.TOCItem
      href={item.url}
      style={{
        paddingInlineStart: getItemOffset(item.depth),
      }}
      className="prose relative py-1.5 text-sm text-foreground-lighter transition-colors [overflow-wrap:anywhere] first:pt-0 last:pb-0 data-[active=true]:text-foreground"
    >
      {offset !== upperOffset ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className="absolute -top-1.5 start-0 size-4 rtl:-scale-x-100"
        >
          <line
            x1={upperOffset}
            y1="0"
            x2={offset}
            y2="12"
            className="stroke-foreground/10"
            strokeWidth="1"
          />
        </svg>
      ) : null}
      <div
        className={cn(
          'absolute inset-y-0 w-px bg-foreground/10',
          offset !== upperOffset && 'top-1.5',
          offset !== lowerOffset && 'bottom-1.5'
        )}
        style={{
          insetInlineStart: offset,
        }}
      />
      {item.title}
    </TocPrimitive.TOCItem>
  )
}
