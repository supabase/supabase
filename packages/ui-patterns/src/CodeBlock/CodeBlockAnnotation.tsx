'use client'

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/src/components/shadcn/ui/tooltip'
import { cn } from 'ui/src/lib/utils/cn'

// this type copies the twoslash hover fields, so the renderers do not depend on twoslash
export interface CodeAnnotation {
  text: string
  docs?: string
  tags?: Array<[name: string, text: string | undefined]>
}

interface AnnotatedSpanProps {
  content: string
  className: string | undefined
  annotations: Array<CodeAnnotation>
}

export const AnnotatedSpan = ({ content, className, annotations }: AnnotatedSpanProps) => {
  const [open, setOpen] = useState(false)

  // a tap gives no hover. null means the last press was not a touch
  const touchTapWasOpen = useRef<boolean | null>(null)

  const handlePointerDown = (evt: PointerEvent) => {
    touchTapWasOpen.current = evt.pointerType === 'touch' ? open : null
  }

  const handleClick = (evt: MouseEvent) => {
    const wasOpen = touchTapWasOpen.current
    touchTapWasOpen.current = null
    if (wasOpen === null) return
    // radix closes the tooltip on pointerdown and on click. preventDefault stops the close on click
    evt.preventDefault()
    evt.stopPropagation()
    setOpen(!wasOpen)
  }

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild onPointerDown={handlePointerDown} onClick={handleClick}>
        <button
          tabIndex={0}
          className={cn(
            className,
            'cursor-help rounded-xs transition-colors',
            'underline underline-offset-4 decoration-dashed',
            'decoration-current/40',
            'hover:decoration-current focus-visible:decoration-current',
            'hover:bg-current/12',
            'focus-visible:bg-current/12'
          )}
        >
          {content}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[min(80vw,400px)] p-0 divide-y">
        {annotations.map((annotation, idx) => (
          <Annotation key={idx} annotation={annotation} />
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

const Annotation = ({ annotation }: { annotation: CodeAnnotation }) => {
  const { text, docs, tags } = annotation
  return (
    <div data-code-style="plain" className="flex flex-col gap-2">
      <code className={cn('block bg-200 p-2', (docs || tags) && 'border-b border-default')}>
        {text}
      </code>
      {docs && <p className={cn('p-2', tags && 'border-b border-default')}>{docs}</p>}
      {tags && (
        <div className="p-2 flex flex-col">
          {tags.map((tag, idx) => {
            return (
              <span key={idx}>
                <code>@{tag[0]}</code> {tag[1]}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
