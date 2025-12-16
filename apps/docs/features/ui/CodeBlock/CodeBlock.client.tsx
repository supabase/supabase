'use client'

import { Check, Copy, WrapText, ArrowRightFromLine } from 'lucide-react'
import { type MouseEvent, useCallback, useEffect, useState, useRef } from 'react'
import { type ThemedToken } from 'shiki'
import { type NodeHover } from 'twoslash'
import { cn, copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { getFontStyle } from './CodeBlock.utils'

export function AnnotatedSpan({
  token,
  annotations,
}: {
  token: ThemedToken
  annotations: Array<NodeHover>
}) {
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
          style={token.htmlStyle}
          className={cn(
            isTouchDevice &&
              'underline underline-offset-4 decoration-dashed [text-decoration-color:rgba(from_currentColor_r_g_b_/_0.5)]'
          )}
        >
          {token.content}
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

function Annotation({ annotation }: { annotation: NodeHover }) {
  const { text, docs, tags } = annotation
  return (
    <div className="flex flex-col gap-2">
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

export function CodeCopyButton({ className, content }: { className?: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    copyToClipboard(content, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'border rounded-md p-1',
        copied && 'bg-selection',
        'hover:bg-selection transition',
        className
      )}
    >
      {copied ? (
        <Check size={14} className="text-lighter" />
      ) : (
        <Copy size={14} className="text-lighter" />
      )}
    </button>
  )
}

export function CodeBlockControls({ content }: { content: string }) {
  const [isWrapped, setIsWrapped] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const toggleWrap = useCallback(() => {
    setIsWrapped((prev) => {
      const newValue = !prev
      // Find the parent code block and toggle the wrap data attribute
      const codeBlock = wrapperRef.current?.closest('.shiki')
      if (codeBlock) {
        if (newValue) {
          codeBlock.setAttribute('data-wrapped', 'true')
        } else {
          codeBlock.removeAttribute('data-wrapped')
        }
      }
      return newValue
    })
  }, [])

  return (
    <div ref={wrapperRef} className="hidden group-hover:flex absolute top-2 right-2 gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleWrap}
            className={cn('border rounded-md p-1', 'hover:bg-selection transition')}
            aria-label={isWrapped ? 'Disable word wrap' : 'Enable word wrap'}
          >
            {isWrapped ? (
              <ArrowRightFromLine size={14} className="text-lighter" />
            ) : (
              <WrapText size={14} className="text-lighter" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{isWrapped ? 'Disable word wrap' : 'Enable word wrap'}</TooltipContent>
      </Tooltip>
      <CodeCopyButton content={content} />
    </div>
  )
}
