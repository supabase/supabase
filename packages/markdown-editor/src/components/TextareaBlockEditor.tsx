import { useImperativeHandle, useRef } from 'react'

import type { BlockEditorProps } from '../types'

export function TextareaBlockEditor({
  value,
  language,
  isReadOnly,
  editorRef,
  onChange,
  onFocus,
  onUndo,
  onRedo,
  onExit,
  onRemove,
}: BlockEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(
    editorRef,
    () => ({
      focus(selection) {
        ref.current?.focus()
        if (selection) ref.current?.setSelectionRange(selection.start, selection.end)
      },
    }),
    []
  )

  return (
    <textarea
      ref={ref}
      aria-label={language ? `${language} code` : 'Block source'}
      data-markdown-block-input=""
      value={value}
      rows={Math.max(1, value.split('\n').length)}
      readOnly={isReadOnly}
      onFocus={onFocus}
      onChange={(event) =>
        onChange(event.target.value, {
          start: event.target.selectionStart,
          end: event.target.selectionEnd,
        })
      }
      onKeyDown={(event) => {
        const modifier = event.metaKey || event.ctrlKey
        if (event.key === 'Backspace' && event.currentTarget.value === '' && !isReadOnly) {
          event.preventDefault()
          event.stopPropagation()
          onRemove()
        } else if (modifier && event.key.toLowerCase() === 'z') {
          event.preventDefault()
          event.stopPropagation()
          if (event.shiftKey) onRedo()
          else onUndo()
        } else if (modifier && event.key.toLowerCase() === 'y') {
          event.preventDefault()
          event.stopPropagation()
          onRedo()
        } else if (event.key === 'Escape' || (modifier && event.key === 'Enter')) {
          event.preventDefault()
          event.stopPropagation()
          onExit(event.shiftKey ? 'before' : 'after')
        } else if (event.currentTarget.selectionStart === event.currentTarget.selectionEnd) {
          const before = event.key === 'ArrowUp' && event.currentTarget.selectionStart === 0
          const after =
            event.key === 'ArrowDown' && event.currentTarget.selectionEnd === value.length
          if (before || after) {
            event.preventDefault()
            event.stopPropagation()
            onExit(before ? 'before' : 'after')
          }
        }
      }}
    />
  )
}
