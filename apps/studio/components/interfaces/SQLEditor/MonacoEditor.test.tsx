import type { Monaco } from '@monaco-editor/react'
import { render } from '@testing-library/react'
import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MonacoEditor } from './MonacoEditor'
import type { IStandaloneCodeEditor } from './SQLEditor.types'

const {
  mockCodeEditor,
  mockUseRouter,
  mockUseProfile,
  mockTabsState,
  mockSqlEditorState,
  mockSidebarState,
  mockAiAssistantState,
} = vi.hoisted(() => ({
  mockCodeEditor: vi.fn(),
  mockUseRouter: vi.fn(),
  mockUseProfile: vi.fn(),
  mockTabsState: {
    makeActiveTabPermanent: vi.fn(),
  },
  mockSqlEditorState: {
    snippets: {},
    addSnippet: vi.fn(),
    setSql: vi.fn(),
    addNeedsSaving: vi.fn(),
  },
  mockSidebarState: {
    openSidebar: vi.fn(),
    toggleSidebar: vi.fn(),
  },
  mockAiAssistantState: {
    newChat: vi.fn(),
  },
}))

vi.mock('common', () => ({
  LOCAL_STORAGE_KEYS: {
    SQL_EDITOR_INTELLISENSE: 'sql-editor-intellisense',
  },
  useParams: () => ({ ref: 'project-ref', content: undefined }),
}))

vi.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}))

vi.mock('@uidotdev/usehooks', () => ({
  useDebounce: (value: string) => value,
}))

vi.mock('ui-patterns', () => ({
  Admonition: () => null,
}))

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: (props: unknown) => {
    mockCodeEditor(props)
    return null
  },
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: () => [true],
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({ data: { id: 1 } }),
}))

vi.mock('@/lib/profile', () => ({
  useProfile: () => mockUseProfile(),
}))

vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => mockAiAssistantState,
}))

vi.mock('@/state/sidebar-manager-state', () => ({
  useSidebarManagerSnapshot: () => mockSidebarState,
}))

vi.mock('@/state/sql-editor-v2', () => ({
  useSqlEditorV2StateSnapshot: () => mockSqlEditorState,
}))

vi.mock('@/state/tabs', () => ({
  useTabsStateSnapshot: () => mockTabsState,
}))

vi.mock('@/state/shortcuts/useIsShortcutEnabled', () => ({
  useIsShortcutEnabled: () => true,
}))

describe('MonacoEditor run query action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      query: {},
      push: vi.fn(),
      replace: vi.fn(),
    })
    mockUseProfile.mockReturnValue({ profile: { id: 'user-1' } })
  })

  it('does not forward selected SQL text into executeQuery', () => {
    const executeQuery = vi.fn()

    render(
      <MonacoEditor
        id="snippet-1"
        snippetName="Query 1"
        editorRef={createRef<IStandaloneCodeEditor | null>()}
        monacoRef={createRef<Monaco | null>()}
        executeQuery={executeQuery}
        executeExplainQuery={vi.fn()}
        prettifyQuery={vi.fn()}
        onHasSelection={vi.fn()}
      />
    )

    const codeEditorProps = mockCodeEditor.mock.calls[0]?.[0] as {
      actions: { runQuery: { callback: (value?: string) => void } }
    }

    expect(codeEditorProps.actions.runQuery.callback).not.toBe(executeQuery)

    codeEditorProps.actions.runQuery.callback('select pg_sleep(10)')

    expect(executeQuery).toHaveBeenCalledTimes(1)
    expect(executeQuery).toHaveBeenCalledWith()
  })
})
