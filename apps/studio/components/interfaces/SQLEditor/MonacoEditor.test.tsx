import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MonacoEditor } from './MonacoEditor'

const codeEditorProps = vi.hoisted(() => ({
  current: undefined as undefined | Record<string, any>,
}))

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: (props: Record<string, any>) => {
    codeEditorProps.current = props
    return null
  },
}))
vi.mock('./useSnippetEditor', () => ({
  useSnippetEditor: () => ({
    snippet: undefined,
    disableEdit: false,
    handleEditorChange: vi.fn(),
  }),
}))
vi.mock('@/state/ai-assistant-state', () => ({ useAiAssistantStateSnapshot: () => ({}) }))
vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => ({ openSidebar: vi.fn(), toggleSidebar: vi.fn() }),
}))
vi.mock('@/hooks/misc/useLocalStorage', () => ({ useLocalStorageQuery: () => [true] }))
vi.mock('@/state/shortcuts/useIsShortcutEnabled', () => ({ useIsShortcutEnabled: () => true }))
vi.mock('@/state/sql-editor/sql-editor-save-coordinator', () => ({
  useSqlEditorSaveCoordinator: () => ({ requestSave: vi.fn() }),
}))

describe('MonacoEditor paste button wiring', () => {
  const renderEditor = (props: { showPasteButton?: boolean } = {}) =>
    render(
      <MonacoEditor
        id="snippet-1"
        snippetName="Untitled"
        editorRef={{ current: null }}
        monacoRef={{ current: null }}
        executeQuery={vi.fn()}
        prettifyQuery={vi.fn()}
        onHasSelection={vi.fn()}
        {...props}
      />
    )

  beforeEach(() => {
    codeEditorProps.current = undefined
  })

  it('forwards showPasteButton=true to CodeEditor', () => {
    renderEditor({ showPasteButton: true })

    expect(codeEditorProps.current?.showPasteButton).toBe(true)
  })

  it('forwards showPasteButton=false to CodeEditor (e.g. while the AI diff is open)', () => {
    renderEditor({ showPasteButton: false })

    expect(codeEditorProps.current?.showPasteButton).toBe(false)
  })

  it('does not opt in to the paste button unless asked', () => {
    renderEditor()

    expect(codeEditorProps.current?.showPasteButton).toBe(false)
  })
})
