'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from 'ui'

import {
  ATTACHMENT_SELECTOR,
  createAttachment,
  createGhost,
  getCaretRangeAt,
  insertAtCaret,
  isInsideAttachment,
  isNextToPill,
  movePill,
  readComment,
  setCaret,
  type PillNodes,
} from './comment-editor.utils'
import type { FeedbackPin } from './feedback-schema'
import { PinChip } from './FeedbackDockAttachments'
import { useEventCallback } from './useEventCallback'
import { useMountEffect } from './useMountEffect'

interface InlinePill extends PillNodes {
  item: FeedbackPin
  key: number
}

export interface CommentEditorProps {
  ref: RefObject<HTMLDivElement | null>
  comment: string
  pins: FeedbackPin[]
  isReadOnly: boolean
  placeholder: string
  maxLength: number
  labelledBy: string
  onCommentChange: (comment: string) => void
  onPinRemove: (index: number) => void
  className?: string
}

// h-6 fills the editor's leading-6 line, so a selected pill spans the same band as
// selected text; colors match the global ::selection
const PILL_CLASSES = cn(
  'inline-flex h-6 items-center align-top',
  'data-[selected]:bg-[#6ee7b7] data-[selected]:[&_*]:text-[#333]'
)

const PILL_DRAG_THRESHOLD_PX = 4

export const CommentEditor = ({
  ref,
  comment,
  pins,
  isReadOnly,
  placeholder,
  maxLength,
  labelledBy,
  onCommentChange,
  onPinRemove,
  className,
}: CommentEditorProps) => {
  const [initialComment] = useState(comment)
  const [pills, setPills] = useState<InlinePill[]>([])
  const pillsRef = useRef<InlinePill[]>([])
  const caretRef = useRef<Range | null>(null)
  const hasMountedRef = useRef(false)
  const nextKeyRef = useRef(0)
  const didDragPillRef = useRef(false)
  const pillDragRef = useRef<AbortController | null>(null)

  const handleSelectionChange = () => {
    const editor = ref.current
    const selection = document.getSelection()
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.startContainer) && !isInsideAttachment(range.startContainer)) {
      caretRef.current = range.cloneRange()
    }
    pillsRef.current.forEach((pill) =>
      pill.node.toggleAttribute(
        'data-selected',
        !selection.isCollapsed && selection.containsNode(pill.node, true)
      )
    )
  }

  const handleBeforeInput = useEventCallback((event: InputEvent) => {
    const editor = ref.current
    if (!editor || !event.inputType.startsWith('insert')) return
    const inserted = event.data ?? event.dataTransfer?.getData('text/plain') ?? ''
    const selected = document.getSelection()?.toString().length ?? 0
    const length = readComment(editor).length - selected + Math.max(inserted.length, 1)
    if (length > maxLength) event.preventDefault()
  })

  useMountEffect(() => {
    const editor = ref.current
    document.addEventListener('selectionchange', handleSelectionChange)
    editor?.addEventListener('beforeinput', handleBeforeInput)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      editor?.removeEventListener('beforeinput', handleBeforeInput)
      pillDragRef.current?.abort()
    }
  })

  // exception: syncs pin props into the contenteditable dom before paint
  useLayoutEffect(() => {
    const editor = ref.current
    if (!editor) return
    const isInitial = !hasMountedRef.current
    hasMountedRef.current = true
    if (isInitial) editor.textContent = initialComment

    const kept = pillsRef.current.filter((pill) => {
      if (pins.includes(pill.item)) return true
      pill.node.remove()
      return false
    })
    const added = pins
      .filter((item) => !kept.some((pill) => pill.item === item))
      .map((item): InlinePill => {
        const node = createAttachment(PILL_CLASSES)
        insertAtCaret({ editor, node, caret: caretRef.current })
        const space = document.createTextNode(' ')
        node.after(space)
        nextKeyRef.current += 1
        return { item, node, space, key: nextKeyRef.current }
      })
    if (kept.length === pillsRef.current.length && added.length === 0) return

    pillsRef.current = [...kept, ...added]
    setPills(pillsRef.current)
    const lastAdded = added.at(-1)
    if (!lastAdded || isInitial) return
    onCommentChange(readComment(editor))
    editor.focus()
    setCaret({ node: lastAdded.space, offset: 1 })
  }, [pins, ref, onCommentChange, initialComment])

  const handleInput = () => {
    const editor = ref.current
    if (!editor) return
    // undo can restore a pill whose pin is gone
    editor.querySelectorAll(ATTACHMENT_SELECTOR).forEach((node) => {
      if (!pillsRef.current.some((pill) => pill.node === node)) node.remove()
    })
    // highest index first so earlier indexes stay valid
    pillsRef.current
      .filter((pill) => !editor.contains(pill.node))
      .map((pill) => pins.indexOf(pill.item))
      .sort((a, b) => b - a)
      .forEach((index) => onPinRemove(index))
    onCommentChange(readComment(editor))
  }

  const handlePillPointerDown = (pill: InlinePill, event: PointerEvent<HTMLButtonElement>) => {
    const editor = ref.current
    if (!editor || isReadOnly || event.button !== 0) return
    event.preventDefault()
    didDragPillRef.current = false
    const start = { x: event.clientX, y: event.clientY }
    pillDragRef.current?.abort()
    const controller = new AbortController()
    pillDragRef.current = controller
    const ghost = createGhost(pill.node)

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      const distance = Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y)
      if (!didDragPillRef.current && distance < PILL_DRAG_THRESHOLD_PX) return
      didDragPillRef.current = true
      const range = getCaretRangeAt({ x: moveEvent.clientX, y: moveEvent.clientY })
      if (!range || !editor.contains(range.startContainer)) return
      if (ghost.contains(range.startContainer) || isInsideAttachment(range.startContainer)) return
      if (isNextToPill({ range, pill })) {
        ghost.remove()
        return
      }
      range.insertNode(ghost)
    }

    const handleEnd = (endEvent: globalThis.PointerEvent) => {
      controller.abort()
      const isDrop = didDragPillRef.current && endEvent.type !== 'pointercancel'
      if (!ghost.isConnected) return
      const range = document.createRange()
      range.setStartBefore(ghost)
      ghost.remove()
      if (!isDrop) return
      editor.focus({ preventScroll: true })
      movePill({ pill, range })
      onCommentChange(readComment(editor))
    }

    window.addEventListener('pointermove', handleMove, { signal: controller.signal })
    window.addEventListener('pointerup', handleEnd, { signal: controller.signal })
    window.addEventListener('pointercancel', handleEnd, { signal: controller.signal })
  }

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!didDragPillRef.current) return
    didDragPillRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const isEmpty = comment === '' && pins.length === 0

  return (
    <div className={cn('grid', className)} onClickCapture={handleClickCapture}>
      <div
        ref={ref}
        role="textbox"
        tabIndex={0}
        aria-multiline
        aria-labelledby={labelledBy}
        aria-placeholder={placeholder}
        aria-readonly={isReadOnly}
        contentEditable={isReadOnly ? 'false' : 'plaintext-only'}
        onInput={handleInput}
        className={cn(
          'col-start-1 row-start-1 cursor-text outline-none',
          'whitespace-pre-wrap break-words text-base leading-6 text-foreground md:text-sm'
        )}
      />
      {isEmpty ? (
        <p
          aria-hidden
          className={cn(
            'pointer-events-none col-start-1 row-start-1',
            'text-base leading-6 text-foreground-muted md:text-sm'
          )}
        >
          {placeholder}
        </p>
      ) : null}
      {pills.map((pill) =>
        createPortal(
          <PinChip pin={pill.item} onPointerDown={(event) => handlePillPointerDown(pill, event)} />,
          pill.node,
          pill.key
        )
      )}
    </div>
  )
}
