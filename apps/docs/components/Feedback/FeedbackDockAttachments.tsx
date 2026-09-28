'use client'

import { useReducedMotion } from 'common'
import { SquareMousePointer, X } from 'lucide-react'
import { useCallback, useState, type FocusEvent, type PointerEvent, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { FeedbackImage } from './feedback-images.utils'
import type { FeedbackPin } from './feedback-schema'
import { ELEMENT_HIGHLIGHT_CLASSES, getPinLabel, getPinNoun, PINNED_ELEMENTS } from './pins.utils'

export interface PinChipProps {
  pin: FeedbackPin
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  className?: string
}

export interface ImageAttachmentListProps {
  images: FeedbackImage[]
  isReadOnly: boolean
  onImageRemove: (path: string) => void
  className?: string
}

interface ImageAttachmentProps {
  image: FeedbackImage
  index: number
  isReadOnly: boolean
  onImageRemove: (path: string) => void
}

interface ElementHighlightProps {
  element: Element
}

interface DockTooltipProps {
  label: string
  children: ReactElement
}

const DOCK_TOOLTIP_DELAY_MS = 400

const INLINE_TOKEN_CLASSES = cn(
  // normal line height keeps the caret beside the pill as tall as beside text
  '-mx-1 rounded px-1 leading-tight hover:underline',
  'focus-visible:outline-none focus-visible:ring-1'
)

const PIN_TOKEN_CLASSES = cn(
  INLINE_TOKEN_CLASSES,
  'text-brand-600 focus-visible:ring-brand-600 dark:text-brand dark:focus-visible:ring-brand'
)

const INLINE_TOKEN_ICON_CLASSES = '-mt-0.5 mr-1 inline size-3.5 align-middle'

const handleTooltipTriggerFocus = (event: FocusEvent<HTMLElement>) => {
  if (!event.currentTarget.matches(':focus-visible')) event.preventDefault()
}

export const ImageAttachmentList = ({
  images,
  isReadOnly,
  onImageRemove,
  className,
}: ImageAttachmentListProps) => (
  <ul aria-label="Attached images" className={cn('flex flex-wrap gap-2', className)}>
    {images.map((image, index) => (
      <ImageAttachment
        key={image.path}
        image={image}
        index={index}
        isReadOnly={isReadOnly}
        onImageRemove={onImageRemove}
      />
    ))}
  </ul>
)

export const DockTooltip = ({ label, children }: DockTooltipProps) => (
  <Tooltip delayDuration={DOCK_TOOLTIP_DELAY_MS}>
    <TooltipTrigger asChild onFocus={handleTooltipTriggerFocus}>
      {children}
    </TooltipTrigger>
    <TooltipContent data-feedback-ui className="max-w-[240px]">
      {label}
    </TooltipContent>
  </Tooltip>
)

export const PinChip = ({ pin, onPointerDown, className }: PinChipProps) => {
  const [isPreviewing, setIsPreviewing] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const target = PINNED_ELEMENTS.get(pin)
  const label = getPinLabel(pin)

  const handlePreviewStart = () => setIsPreviewing(true)
  const handlePreviewEnd = () => setIsPreviewing(false)
  const handleClick = () =>
    target?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })

  return (
    <>
      <DockTooltip label={label}>
        <button
          type="button"
          tabIndex={0}
          aria-label={label}
          onPointerEnter={handlePreviewStart}
          onPointerLeave={handlePreviewEnd}
          onFocus={handlePreviewStart}
          onBlur={handlePreviewEnd}
          onClick={handleClick}
          onPointerDown={onPointerDown}
          className={cn(PIN_TOKEN_CLASSES, className)}
        >
          <SquareMousePointer aria-hidden className={INLINE_TOKEN_ICON_CLASSES} />
          {getPinNoun(pin)}
        </button>
      </DockTooltip>
      {isPreviewing && target?.isConnected ? <ElementHighlight element={target} /> : null}
    </>
  )
}

const ImageAttachment = ({ image, index, isReadOnly, onImageRemove }: ImageAttachmentProps) => {
  // stable so each render doesn't swap in a fresh object url
  const previewRef = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return
      const url = URL.createObjectURL(image.file)
      img.src = url
      return () => URL.revokeObjectURL(url)
    },
    [image.file]
  )

  const handleRemove = () => onImageRemove(image.path)

  return (
    <li className="group relative size-8 overflow-hidden rounded border border-default bg-surface-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize */}
      <img ref={previewRef} alt={`Attachment ${index + 1}`} className="size-full object-cover" />
      {isReadOnly ? null : (
        <DockTooltip label="Remove image">
          <Button
            variant="default"
            aria-label={`Remove image ${index + 1}`}
            className={cn(
              'invisible absolute right-0.5 top-0.5 size-3.5 p-0 [&_svg]:size-2.5',
              'group-focus-within:visible group-hover:visible'
            )}
            icon={<X />}
            onClick={handleRemove}
          />
        </DockTooltip>
      )}
    </li>
  )
}

const ElementHighlight = ({ element }: ElementHighlightProps) => {
  const trackElement = (box: HTMLDivElement) => {
    let frame = 0
    const paint = () => {
      const rect = element.getBoundingClientRect()
      box.style.transform = `translate(${rect.left}px, ${rect.top}px)`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`
      frame = requestAnimationFrame(paint)
    }
    paint()
    return () => cancelAnimationFrame(frame)
  }

  return createPortal(
    <div ref={trackElement} aria-hidden data-feedback-ui className={ELEMENT_HIGHLIGHT_CLASSES} />,
    document.body
  )
}
