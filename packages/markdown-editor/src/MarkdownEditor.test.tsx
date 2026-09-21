import { act, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

import { MarkdownEditor } from './MarkdownEditor'
import type { MarkdownEditorHandle } from './types'

it('does not edit a read-only document when leaving an embedded code block', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const mount = document.body.appendChild(document.createElement('div'))
  const root = createRoot(mount)
  const ref = createRef<MarkdownEditorHandle>()
  const onChange = vi.fn()
  const markdown = '```\nRead only\n```'
  try {
    await act(() =>
      root.render(
        <MarkdownEditor
          ref={ref}
          markdown={markdown}
          onChange={onChange}
          aria-label="Notes"
          isReadOnly
        />
      )
    )
    const textarea = mount.querySelector('textarea')!
    for (const key of ['Escape', 'ArrowDown']) {
      await act(() => {
        textarea.focus()
        textarea.setSelectionRange(textarea.value.length, textarea.value.length)
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
      })
    }
    expect(ref.current?.flush()).toBe(markdown)
    expect(onChange).not.toHaveBeenCalled()
    expect(mount.querySelector('p')).toBeNull()
  } finally {
    await act(() => root.unmount())
    mount.remove()
    vi.unstubAllGlobals()
  }
})
