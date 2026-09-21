import { redo, undo } from 'prosemirror-history'
import { TextSelection } from 'prosemirror-state'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createBlockStore } from './components/BlockViews'
import { createMarkdownView } from './createEditor'
import type { MarkdownEditorProps } from './types'

const editors: ReturnType<typeof createMarkdownView>[] = []
function setup(markdown = '**bold**') {
  const mount = document.body.appendChild(document.createElement('div'))
  const props: MarkdownEditorProps = {
    markdown,
    'aria-label': 'Markdown',
    onChange: vi.fn(),
    onDirty: vi.fn(),
    onConflict: vi.fn(),
  }
  const editor = createMarkdownView(mount, () => props, createBlockStore())
  editors.push(editor)
  return { ...editor, props }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy())
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('editor synchronization', () => {
  it('flushes the latest edit synchronously before a save and accepts its echo without losing undo', () => {
    const { view, props, flush, receive } = setup('Original')
    view.dispatch(view.state.tr.insertText('!', 9))
    expect(props.onDirty).toHaveBeenCalledOnce()
    expect(props.onChange).not.toHaveBeenCalled()

    expect(flush()).toBe('Original!')
    expect(props.onChange).toHaveBeenCalledExactlyOnceWith('Original!')
    receive('Original!')
    undo(view.state, view.dispatch)
    expect(flush()).toBe('Original')
    vi.runAllTimers()
    expect(props.onChange).toHaveBeenCalledTimes(2)
  })

  it('debounces edits but flushes continuous typing within one second', () => {
    const { view, props } = setup('Text')
    for (let i = 0; i < 5; i++) {
      view.dispatch(view.state.tr.insertText('!', 5 + i))
      vi.advanceTimersByTime(200)
      if (i < 4) expect(props.onChange).not.toHaveBeenCalled()
    }
    expect(props.onChange).toHaveBeenCalledExactlyOnceWith('Text!!!!!')
  })

  it('retains pending local edits when an external update conflicts', () => {
    const { view, props, receive, flush } = setup('Original')
    view.dispatch(view.state.tr.insertText('!', 9))
    receive('External')
    expect(props.onConflict).toHaveBeenCalledExactlyOnceWith('External')
    expect(flush()).toBe('Original!')
  })

  it('flushes pending edits when the editor is destroyed', () => {
    const { view, props, destroy } = setup('Original')
    view.dispatch(view.state.tr.insertText('!', 9))
    editors.pop()
    destroy()
    expect(props.onChange).toHaveBeenCalledExactlyOnceWith('Original!')
  })
})

describe('paste', () => {
  it.each([
    ['x', '**boxld**'],
    ['*x*', '**bo***x***ld**'],
    ['# Heading\n\nParagraph', '**bo**Heading\n\nParagraph**ld**'],
  ])('preserves plain-text formatting and Markdown structure: %s', (text, expected) => {
    const { view, flush } = setup()
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 3)))
    view.dom.dispatchEvent(
      Object.assign(new Event('paste', { bubbles: true, cancelable: true }), {
        clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : '') },
      })
    )
    expect(flush()).toBe(expected)
  })
})

it('blocks document edits, undo and redo in read-only mode while allowing external updates', () => {
  const { view, props, receive, flush } = setup('Original')
  view.dispatch(view.state.tr.insertText('!', 9))
  flush()
  props.isReadOnly = true
  receive('Original!')
  undo(view.state, view.dispatch)
  view.dispatch(view.state.tr.insertText('Blocked', 1))
  expect(flush()).toBe('Original!')

  props.isReadOnly = false
  undo(view.state, view.dispatch)
  expect(flush()).toBe('Original')
  props.isReadOnly = true
  redo(view.state, view.dispatch)
  expect(flush()).toBe('Original')
  receive('External')
  expect(flush()).toBe('External')
})
