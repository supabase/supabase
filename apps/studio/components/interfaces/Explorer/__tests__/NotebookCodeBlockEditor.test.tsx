import type { Monaco } from '@monaco-editor/react'
import { act, render } from '@testing-library/react'
import type { BlockEditorHandle, BlockEditorProps } from 'markdown-editor/types'
import type { editor } from 'monaco-editor'
import { createRef, type ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotebookCodeBlockEditor } from '../NotebookCodeBlockEditor'
import type { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

const { capture } = vi.hoisted(() => ({
  capture: vi.fn<(props: ComponentProps<typeof CodeEditor>) => void>(),
}))
vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: (props: ComponentProps<typeof CodeEditor>) => {
    capture(props)
    return <textarea aria-label="Mounted code editor" defaultValue={props.value} />
  },
}))

beforeEach(() => capture.mockClear())

function setup() {
  const props: BlockEditorProps = {
    value: 'select 1',
    language: 'sql',
    isReadOnly: false,
    editorRef: createRef<BlockEditorHandle>(),
    onChange: vi.fn(),
    onFocus: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onExit: vi.fn(),
    onRemove: vi.fn(),
  }
  render(<NotebookCodeBlockEditor {...props} />)
  return props
}

function mountMonaco() {
  const props = capture.mock.lastCall![0]
  const context = new Map<string, boolean>([['editorTextFocus', true]])
  const commands = new Map<number, { run: () => void; when: string }>()
  let offset = props.value!.length
  let selectionChanged = () => {}
  const disposable = { dispose: vi.fn() }
  const instance = {
    focus: vi.fn(),
    setSelection: vi.fn(),
    getContentHeight: () => 60,
    getModel: () => ({
      getValueLength: () => props.value!.length,
      getOffsetAt: () => offset,
      getPositionAt: (position: number) => ({ lineNumber: 1, column: position + 1 }),
    }),
    getSelection: () => ({ isEmpty: () => true, getStartPosition: () => ({}) }),
    createContextKey: (name: string) => ({ set: (value: boolean) => context.set(name, value) }),
    addCommand: (key: number, run: () => void, when: string) => commands.set(key, { run, when }),
    onDidContentSizeChange: () => disposable,
    onDidFocusEditorText: () => disposable,
    onDidChangeModelContent: () => disposable,
    onDidChangeCursorSelection: (listener: () => void) => {
      selectionChanged = listener
      return disposable
    },
  }
  const monaco = {
    KeyCode: { UpArrow: 16, DownArrow: 18, Backspace: 1, Escape: 9, Enter: 3, KeyZ: 56, KeyY: 55 },
    KeyMod: { CtrlCmd: 2048, Shift: 1024 },
  }
  // Only the Monaco surface consumed by the adapter is needed by this test double.
  act(() => props.onMount!(instance as unknown as editor.IStandaloneCodeEditor, monaco as Monaco))
  return {
    instance,
    context,
    moveCursor(position: number) {
      offset = position
      selectionChanged()
    },
    press(key: number) {
      const command = commands.get(key)!
      const isEnabled = command.when
        .split(' && ')
        .every((condition) =>
          condition.startsWith('!') ? !context.get(condition.slice(1)) : context.get(condition)
        )
      if (isEnabled) command.run()
    },
  }
}

describe('NotebookCodeBlockEditor', () => {
  it('preserves a requested selection while Monaco initializes', () => {
    const props = setup()
    const ref = props.editorRef
    if (!ref || typeof ref === 'function') throw new Error('Expected an object ref')
    act(() => ref.current?.focus({ start: 2, end: 4 }))
    const { instance } = mountMonaco()
    expect(instance.setSelection).toHaveBeenCalledWith({
      startLineNumber: 1,
      startColumn: 3,
      endLineNumber: 1,
      endColumn: 5,
    })
  })

  it('leaves suggestions in control of arrow keys and only exits at document boundaries', () => {
    const props = setup()
    const { context, press, moveCursor } = mountMonaco()
    context.set('suggestWidgetVisible', true)
    press(18)
    expect(props.onExit).not.toHaveBeenCalled()
    context.set('suggestWidgetVisible', false)
    press(18)
    expect(props.onExit).toHaveBeenCalledExactlyOnceWith('after')
    moveCursor(3)
    press(16)
    press(18)
    expect(props.onExit).toHaveBeenCalledTimes(1)
    moveCursor(0)
    press(16)
    expect(props.onExit).toHaveBeenLastCalledWith('before')
  })
})
