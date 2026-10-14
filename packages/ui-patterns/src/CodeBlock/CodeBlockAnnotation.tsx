'use client'

import { useCallback, useEffect, useState, type MouseEvent } from 'react'
// deep imports: kb renders the frame inside astro's config, where the `ui` barrel can't load
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/src/components/shadcn/ui/tooltip'
import { cn } from 'ui/src/lib/utils/cn'

// structural copy of twoslash's hover fields, so renderers don't depend on twoslash
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

  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    const touchDevice = !window.matchMedia('(pointer: fine)').matches
    setIsTouchDevice(touchDevice)
  }, [])

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      if (isTouchDevice) {
        evt.preventDefault()
        evt.stopPropagation()
        setOpen((open) => !open)
      }
    },
    [isTouchDevice]
  )
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!isTouchDevice || !open) {
        setOpen(open)
      }
    },
    [isTouchDevice]
  )

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild onClick={handleClick}>
        <button
          tabIndex={0}
          className={cn(
            className,
            isTouchDevice &&
              'underline underline-offset-4 decoration-dashed decoration-[rgba(from_currentColor_r_g_b/0.5)]'
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
