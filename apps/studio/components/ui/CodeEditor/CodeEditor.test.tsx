import { describe, expect, it } from 'vitest'

import { CodeEditor } from './CodeEditor'
import { render } from '@/tests/helpers'

/**
 * CodeEditor applies a default `h-full` so editors with no explicit height fill their container
 * (GraphiQL, etc.). Callers that DO set a height (e.g. the email template editor's `h-96`) must
 * win — otherwise the editor collapses to a single line.
 *
 * This regressed once already: #47339 appended the default as `cn(className, 'monaco-editor',
 * 'h-full')`, and tailwind-merge keeps the *last* conflicting height utility, so the trailing
 * `h-full` clobbered caller heights. #47350 fixed it by passing `className` last. These tests
 * lock that ordering in.
 *
 * The `<div className={...}>` that receives the class is rendered by @monaco-editor/react before
 * Monaco loads, so it's present in jsdom without a working editor.
 */
describe('CodeEditor height class precedence', () => {
  const getEditorEl = (container: HTMLElement) => container.querySelector('.monaco-editor')

  it('lets a caller-supplied height win over the default h-full (regression #47350)', () => {
    const { container } = render(<CodeEditor language="pgsql" className="h-96" />)

    const editor = getEditorEl(container)
    expect(editor, 'editor wrapper should render').toBeTruthy()
    expect(editor).toHaveClass('h-96')
    expect(editor, 'default h-full must not override the caller height').not.toHaveClass('h-full')
  })

  it('falls back to the default h-full when the caller sets no height', () => {
    const { container } = render(<CodeEditor language="pgsql" />)

    const editor = getEditorEl(container)
    expect(editor, 'editor wrapper should render').toBeTruthy()
    expect(editor).toHaveClass('h-full')
  })
})
