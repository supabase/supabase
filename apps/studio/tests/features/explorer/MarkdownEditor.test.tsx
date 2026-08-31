import type { MDXEditorMethods } from '@mdxeditor/editor'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useEffect, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { InitializedMarkdownEditor } from '@/components/interfaces/Explorer/InitializedMarkdownEditor'
import { clickDropdown } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({
    editorRef,
    language,
    onInputChange,
    onMount,
    value = '',
  }: {
    editorRef?: React.MutableRefObject<unknown>
    language: string
    onInputChange?: (value?: string) => void
    onMount?: (editor: {
      focus: () => void
      getDomNode: () => HTMLElement | null
      getValue: () => string
      onDidDispose: (callback: () => void) => { dispose: () => void }
    }) => void
    value?: string
  }) => {
    const elementRef = useRef<HTMLTextAreaElement>(null)
    const valueRef = useRef(value)
    valueRef.current = value

    useEffect(() => {
      const disposeCallbacks = new Set<() => void>()
      const editor = {
        focus: () => elementRef.current?.focus(),
        getDomNode: () => elementRef.current,
        getValue: () => valueRef.current,
        onDidDispose: (callback: () => void) => {
          disposeCallbacks.add(callback)
          return { dispose: () => disposeCallbacks.delete(callback) }
        },
      }

      if (editorRef) editorRef.current = editor
      onMount?.(editor)

      return () => {
        disposeCallbacks.forEach((callback) => callback())
        if (editorRef) editorRef.current = null
      }
    }, [editorRef, onMount])

    return (
      <textarea
        ref={elementRef}
        aria-label="Code editor"
        data-language={language}
        value={value}
        onChange={(event) => onInputChange?.(event.target.value)}
      />
    )
  },
}))

const renderEditor = (markdown = '') =>
  customRender(
    <InitializedMarkdownEditor
      editorRef={createRef<MDXEditorMethods>()}
      markdown={markdown}
      onChange={vi.fn()}
    />
  )

describe('InitializedMarkdownEditor', () => {
  it('shows a friendly label for a fenced language alias', async () => {
    renderEditor('```js\nconst answer = 42\n```')

    expect(await screen.findByRole('button', { name: 'JavaScript' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveAttribute(
      'data-language',
      'javascript'
    )
  })

  it('changes the fenced language from the code block picker', async () => {
    const user = userEvent.setup()
    renderEditor('```js\nconst answer = 42\n```')

    clickDropdown(await screen.findByRole('button', { name: 'JavaScript' }))
    await user.click(await screen.findByRole('menuitemradio', { name: 'SQL' }))

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Code editor' })).toHaveAttribute(
        'data-language',
        'pgsql'
      )
    )
  })

  it('keeps the block when deleting its last character, then removes the empty block', async () => {
    const user = userEvent.setup()
    renderEditor('```text\na\n```')

    const codeEditor = await screen.findByRole<HTMLTextAreaElement>('textbox', {
      name: 'Code editor',
    })
    codeEditor.setSelectionRange(1, 1)
    codeEditor.focus()

    await user.keyboard('{Backspace}')
    expect(codeEditor).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Code editor' })).toBeInTheDocument()

    await user.keyboard('{Backspace}')
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Code editor' })).not.toBeInTheDocument()
    )
  })
})
