'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { getMeaningfulTarget, PICKING_ATTRIBUTE, snapshotElement } from './dom-snapshot'
import { describeElement } from './element-descriptor.utils'
import { ELEMENT_HIGHLIGHT_CLASSES, getPinNoun, PINNED_ELEMENTS } from './pins.utils'
import { useFeedbackDock } from './FeedbackDockProvider'
import { useEventCallback } from './useEventCallback'
import { useMountEffect } from './useMountEffect'

interface Point {
  x: number
  y: number
}

export interface ElementPickerProps {
  className?: string
}

const PICKING_STYLES = `
[${PICKING_ATTRIBUTE}] iframe { pointer-events: none !important; }
[${PICKING_ATTRIBUTE}] body *:not([data-feedback-ui], [data-feedback-ui] *) { cursor: crosshair !important; }
`

const BLOCKED_EVENTS = [
  'pointerdown',
  'mousedown',
  'pointerup',
  'mouseup',
  'click',
  'auxclick',
  'contextmenu',
] as const

const MAX_IFRAME_ANCESTOR_DEPTH = 3

const LABEL_CURSOR_OFFSET = 12

const resolveTarget = ({ x, y }: Point): Element | null => {
  const hit = document.elementsFromPoint(x, y).find((element) => !isInsideFeedbackUi(element))
  if (!hit || hit === document.documentElement || hit === document.body) return null
  return findIframeAt({ element: hit, x, y }) ?? getMeaningfulTarget(hit)
}

const findIframeAt = ({ element, x, y }: Point & { element: Element }): Element | null => {
  if (!document.querySelector('iframe')) return null
  let scope: Element | null = element
  for (let depth = 0; scope && depth <= MAX_IFRAME_ANCESTOR_DEPTH; depth += 1) {
    const frames = [scope, ...scope.querySelectorAll('iframe')]
    const frame = frames.find((node) => node.tagName === 'IFRAME' && containsPoint({ node, x, y }))
    if (frame) return frame
    scope = scope.parentElement
  }
  return null
}

const containsPoint = ({ node, x, y }: Point & { node: Element }) => {
  const rect = node.getBoundingClientRect()
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

const placeLabel = ({ label, pointer }: { label: HTMLElement; pointer: Point }) => {
  const { clientWidth, clientHeight } = document.documentElement
  const right = pointer.x + LABEL_CURSOR_OFFSET
  const below = pointer.y + LABEL_CURSOR_OFFSET
  const x =
    right + label.offsetWidth > clientWidth
      ? pointer.x - LABEL_CURSOR_OFFSET - label.offsetWidth
      : right
  const y =
    below + label.offsetHeight > clientHeight
      ? pointer.y - LABEL_CURSOR_OFFSET - label.offsetHeight
      : below
  label.style.transform = `translate(${x}px, ${y}px)`
}

const isInsideFeedbackUi = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('[data-feedback-ui]') !== null

export const ElementPicker = ({ className }: ElementPickerProps) => {
  const { state, actions } = useFeedbackDock()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const pathname = usePathname() ?? ''
  const [startPathname] = useState(pathname)
  const boxRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  const describe = useEventCallback((element: Element) =>
    describeElement(snapshotElement({ element, pathname }))
  )

  const exitPicking = useEventCallback(() => actions.setPicking(false))

  const pinElement = useEventCallback((element: Element) => {
    const pin = describe(element)
    PINNED_ELEMENTS.set(pin, element)
    actions.addPin(pin)
    sendTelemetryEvent({
      action: 'docs_feedback_pin_added',
      properties: { pinCount: state.draft.pins.length + 1, elementRole: pin.role },
    })
    actions.setPicking(false)
  })

  // exception: reacts to router navigation, which has no event to hook
  useEffect(() => {
    if (pathname !== startPathname) actions.setPicking(false)
  }, [pathname, startPathname, actions])

  useMountEffect(() => {
    const box = boxRef.current
    const label = labelRef.current
    if (!box || !label) return

    const controller = new AbortController()
    const root = document.documentElement
    const previousCursor = root.style.cursor
    let pointer: Point | null = null
    let highlighted: Element | null = null
    let frame = 0

    root.setAttribute(PICKING_ATTRIBUTE, '')
    root.style.cursor = 'crosshair'

    const listen = (
      target: EventTarget,
      type: string,
      listener: (event: Event) => void,
      options: AddEventListenerOptions = {}
    ) => target.addEventListener(type, listener, { ...options, signal: controller.signal })

    const paint = () => {
      frame = 0
      const target = pointer ? resolveTarget(pointer) : null
      box.hidden = !target
      label.hidden = !target
      if (!target) return

      const rect = target.getBoundingClientRect()
      box.style.transform = `translate(${rect.left}px, ${rect.top}px)`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`
      if (target !== highlighted) {
        highlighted = target
        label.textContent = getPinNoun(describe(target))
      }
      if (pointer) placeLabel({ label, pointer })
    }

    const schedulePaint = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const handlePointerMove = (event: Event) => {
      if (!(event instanceof MouseEvent)) return
      pointer = { x: event.clientX, y: event.clientY }
      schedulePaint()
    }

    const handleBlockedEvent = (event: Event) => {
      if (isInsideFeedbackUi(event.target)) return
      // detail 0 is a keyboard click, let it through
      if (event.type === 'click' && event instanceof MouseEvent && event.detail === 0) return

      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.type !== 'click' || !(event instanceof MouseEvent)) return

      const target = resolveTarget({ x: event.clientX, y: event.clientY })
      if (target) pinElement(target)
    }

    const handleKeyDown = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== 'Escape') return
      event.preventDefault()
      event.stopImmediatePropagation()
      exitPicking()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') exitPicking()
    }

    const handleExit = () => exitPicking()

    listen(window, 'pointermove', handlePointerMove, { capture: true, passive: true })
    listen(window, 'scroll', schedulePaint, { capture: true, passive: true })
    listen(window, 'resize', schedulePaint, { passive: true })
    BLOCKED_EVENTS.forEach((type) => listen(window, type, handleBlockedEvent, { capture: true }))
    listen(window, 'keydown', handleKeyDown, { capture: true })
    listen(document, 'visibilitychange', handleVisibilityChange)
    listen(window, 'pagehide', handleExit)
    listen(window, 'blur', handleExit)

    return () => {
      controller.abort()
      cancelAnimationFrame(frame)
      root.removeAttribute(PICKING_ATTRIBUTE)
      root.style.cursor = previousCursor
    }
  })

  return (
    <>
      <style>{PICKING_STYLES}</style>
      <div
        ref={boxRef}
        aria-hidden
        hidden
        data-feedback-ui
        className={cn(ELEMENT_HIGHLIGHT_CLASSES, className)}
      />
      <span
        ref={labelRef}
        aria-hidden
        hidden
        data-feedback-ui
        className={cn(
          'pointer-events-none fixed left-0 top-0 z-[60] max-w-[180px] truncate rounded-md',
          'bg-brand-600 px-2 py-1 text-xs text-white dark:bg-brand-500 dark:text-brand-600'
        )}
      />
    </>
  )
}
