'use client'

import Breadcrumbs from '~/components/Breadcrumbs'
import { usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { cn } from 'ui'

export type OutlineBlock =
  | 'heading'
  | 'code'
  | 'callout'
  | 'tabs'
  | 'step'
  | 'media'
  | `text-${1 | 2 | 3 | 4}`
  | `list-${1 | 2 | 3 | 4}`

interface GuideShape {
  title: string
  subtitle?: string
  hasVideo?: boolean
  hideToc?: boolean
  outline?: OutlineBlock[]
}

export type GuideShapes = Record<string, GuideShape>

interface GuideSkeletonProps {
  shapes: GuideShapes
}

interface WellProps {
  className?: string
  style?: React.CSSProperties
}

interface LinesProps {
  count: number
  className?: string
}

interface OutlineBlockWellsProps {
  block: OutlineBlock
  isFirstStep: boolean
}

interface SubtitleWellsProps {
  text: string
}

interface LineBox {
  id: string
  left: number
  top: number
  width: number
}

const WELL_HEIGHT = 14

// the page that replaces the skeleton fades in from the skeleton's brightness, see guide-skeleton.css
const revealOnUnmount = (element: HTMLDivElement | null) => {
  if (!element) return
  return () => {
    const root = document.documentElement
    root.dataset.guideReveal = ''
    const duration = parseFloat(getComputedStyle(root).getPropertyValue('--guide-reveal-duration'))
    setTimeout(() => delete root.dataset.guideReveal, duration || 400)
  }
}

export const GuideSkeleton = ({ shapes }: GuideSkeletonProps) => {
  // a page outside the map, such as federated content, gets the most common shape
  const shape = shapes[usePathname()]

  return (
    <div ref={revealOnUnmount} role="status" className="grid grid-cols-12 gap-4">
      <span className="sr-only">Loading page</span>
      <div className="col-span-12 md:col-span-8 flex flex-col gap-12">
        <div className="flex items-center text-sm">
          <Breadcrumbs />
        </div>
        <header className="flex flex-col gap-3">
          {shape ? (
            <div className="prose max-w-none">
              <h1 className="mt-0 mb-0">{shape.title}</h1>
            </div>
          ) : (
            <Well className="h-10 w-2/3" />
          )}
          {shape?.subtitle ? <SubtitleWells text={shape.subtitle} /> : null}
        </header>
        {shape?.outline ? (
          <div className="flex flex-col gap-6">
            {shape.outline.map((block, position) => (
              <OutlineBlockWells
                key={`${position}:${block}`}
                block={block}
                isFirstStep={block === 'step' && shape.outline?.[position - 1] !== 'step'}
              />
            ))}
          </div>
        ) : (
          <Lines count={4} />
        )}
      </div>
      <aside className="hidden md:flex md:col-span-3 md:col-start-10 self-start px-px">
        <div className="w-full border-l flex flex-col gap-6 lg:gap-8 px-2">
          {shape?.hasVideo ? <Well className="ml-5 h-auto aspect-video rounded-md" /> : null}
          <div className="pl-5 flex flex-col gap-2.5">
            <Well className="w-1/2" />
            <Well className="w-2/3" />
          </div>
          {shape?.hideToc ? null : (
            <div className="pl-5 flex flex-col gap-2.5">
              <Well className="w-1/2" />
              <Well className="w-3/4" />
              <Well className="w-2/3" />
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

const Well = ({ className, style }: WellProps) => (
  <span
    aria-hidden
    className={cn('guide-skeleton-well block h-3 rounded', className)}
    style={style}
  />
)

const Lines = ({ count, className }: LinesProps) => (
  <div className={cn('flex flex-col gap-3.5', className)}>
    {Array.from({ length: count }, (_, line) => (
      <Well key={`line-${line}`} className={count > 1 && line === count - 1 ? 'w-3/5' : 'w-full'} />
    ))}
  </div>
)

const OutlineBlockWells = ({ block, isFirstStep }: OutlineBlockWellsProps) => {
  if (block === 'heading') return <Well className="h-5 w-2/5" />
  if (block === 'code') return <Well className="h-20 w-full rounded-lg" />
  if (block === 'media') return <Well className="h-auto w-full aspect-video rounded-lg" />
  if (block === 'callout') return <Well className="h-16 w-full rounded-lg" />
  if (block === 'tabs') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Well className="h-4 w-16" />
          <Well className="h-4 w-16" />
          <Well className="h-4 w-16" />
        </div>
        <Well className="h-20 w-full rounded-lg" />
      </div>
    )
  }
  if (block === 'step') {
    return (
      <div className={cn('relative flex gap-6 pb-2', isFirstStep && 'pt-8')}>
        <Well
          className={cn(
            'absolute left-[11px] bottom-0 h-auto w-0.5 rounded-full',
            isFirstStep ? 'top-[60px]' : 'top-7'
          )}
        />
        <Well className="h-6 w-6 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-4.5">
          <Well className="h-4 w-1/2" />
          <div className="flex flex-col gap-6">
            <Lines count={2} />
            <Well className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }
  const [kind, count] = block.split('-')
  return <Lines count={Number(count)} className={kind === 'list' ? 'pl-5' : undefined} />
}

// the hidden subtitle wraps like the real one, so there is one well per real line
const SubtitleWells = ({ text }: SubtitleWellsProps) => {
  const [lines, setLines] = useState<LineBox[]>([])

  // a stable ref measures once on mount, and the update runs before the first paint
  const measure = useCallback((element: HTMLParagraphElement | null) => {
    if (!element) return
    const range = document.createRange()
    range.selectNodeContents(element)
    const origin = element.getBoundingClientRect()
    setLines(
      [...range.getClientRects()]
        .filter((line) => line.width > 1)
        .map((line) => ({
          id: `${Math.round(line.top)}`,
          left: line.left - origin.left,
          top: line.top - origin.top + (line.height - WELL_HEIGHT) / 2,
          width: line.width,
        }))
    )
  }, [])

  return (
    <div className="relative">
      <p ref={measure} aria-hidden className="m-0 text-xl leading-7 text-transparent">
        {text}
      </p>
      {lines.map((line) => (
        <Well
          key={line.id}
          className="absolute"
          style={{ left: line.left, top: line.top, width: line.width, height: WELL_HEIGHT }}
        />
      ))}
    </div>
  )
}
