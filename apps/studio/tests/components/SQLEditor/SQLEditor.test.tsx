import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SQLEditor } from '@/components/interfaces/SQLEditor/SQLEditor'
import { DiffType } from '@/components/interfaces/SQLEditor/SQLEditor.types'
import { sqlEditorDiffRequestState } from '@/state/sql-editor/sql-editor-diff-request'
import { sqlEditorSessionState } from '@/state/sql-editor/sql-editor-session-state'
import { sqlEditorState } from '@/state/sql-editor/sql-editor-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

/**
 * Characterization tests for the (pre-decomposition) `SQLEditor` monolith.
 *
 * These tests are not intended to be a model of best practices; they
 * over-mock and assert on implementation details. They are temporary to
 * capture regressions while the editor is being decomposed into smaller, more
 * testable components.
 */

const SNIPPET_ID = 'test-snippet-id'

// A single mutable fake-editor state so tests can drive selection / value /
// decoration ids, shared into the hoisted module mocks below.
const mocks = vi.hoisted(() => {
  const state = {
    value: 'select 1;',
    selection: null as null | { startLineNumber: number },
    selectionValue: undefined as string | undefined,
    decorations: ['decoration-1'] as string[],
    scrollHandler: null as null | ((e: { scrollTop: number }) => void),
    diffModifiedValue: 'select 2;',
  }

  const editor = {
    getValue: () => state.value,
    getSelection: () => state.selection,
    getModel: () => ({
      getValueInRange: (_selection: unknown) => state.selectionValue,
      getFullModelRange: () => ({ __fullRange: true }),
    }),
    executeEdits: vi.fn(),
    deltaDecorations: vi.fn(
      (_oldDecorations: string[], _newDecorations: any[]) => state.decorations
    ),
    revealLineInCenter: vi.fn(),
    onDidScrollChange: vi.fn((cb: (e: { scrollTop: number }) => void) => {
      state.scrollHandler = cb
    }),
    setScrollTop: vi.fn(),
    focus: vi.fn(),
  }

  class FakeRange {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
    constructor(a: number, b: number, c: number, d: number) {
      this.startLineNumber = a
      this.startColumn = b
      this.endLineNumber = c
      this.endColumn = d
    }
  }
  const monaco = { Range: FakeRange }

  const diffEditor = {
    getModel: () => ({
      original: { setValue: vi.fn(), getValue: () => '' },
      modified: { setValue: vi.fn(), getValue: () => state.diffModifiedValue },
    }),
    getModifiedEditor: () => ({ revealLineInCenter: vi.fn() }),
  }

  return { state, editor, monaco, diffEditor }
})

// --- Editor fakes -----------------------------------------------------------

vi.mock('@/components/interfaces/SQLEditor/MonacoEditor', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    MonacoEditor: (props: any) => {
      useEffect(() => {
        props.editorRef.current = mocks.editor
        props.monacoRef.current = mocks.monaco
        props.onMount?.(mocks.editor)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return (
        <div data-testid="monaco-editor">
          <div data-testid="monaco-placeholder">{props.placeholder}</div>
          <button data-testid="editor-run" onClick={() => props.executeQuery()}>
            run
          </button>
          <button data-testid="editor-explain" onClick={() => props.executeExplainQuery?.()}>
            explain
          </button>
          <button
            data-testid="editor-prompt"
            onClick={() =>
              props.onPrompt?.({
                selection: '',
                beforeSelection: '',
                afterSelection: '',
                startLineNumber: 1,
                endLineNumber: 1,
              })
            }
          >
            prompt
          </button>
        </div>
      )
    },
  }
})

vi.mock('@/components/ui/DiffEditor', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    DiffEditor: (props: any) => {
      useEffect(() => {
        props.onMount?.(mocks.diffEditor)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])
      return <div data-testid="diff-editor" />
    },
  }
})

vi.mock('@/components/ui/AIEditor/ResizableAIWidget', () => ({
  default: (props: any) => (
    <div data-testid={props.id}>
      <button data-testid={`${props.id}-accept`} onClick={props.onAccept}>
        accept
      </button>
      <button data-testid={`${props.id}-reject`} onClick={props.onReject}>
        reject
      </button>
      <button data-testid={`${props.id}-cancel`} onClick={props.onCancel}>
        cancel
      </button>
    </div>
  ),
}))

// --- Child panel stubs (not under test) -------------------------------------

vi.mock('@/components/interfaces/SQLEditor/UtilityPanel/UtilityActions', () => ({
  UtilityActions: (props: any) => (
    <div data-testid="utility-actions">
      <button
        data-testid="run-button"
        disabled={props.isDisabled}
        onClick={() => props.executeQuery()}
      >
        Run
      </button>
      <button data-testid="prettify-button" onClick={() => props.prettifyQuery()}>
        Prettify
      </button>
      <span data-testid="is-executing">{String(props.isExecuting)}</span>
    </div>
  ),
}))

vi.mock('@/components/interfaces/SQLEditor/UtilityPanel/UtilityPanel', () => ({
  UtilityPanel: (props: any) => (
    <div data-testid="utility-panel">
      <span data-testid="active-tab">{props.activeTab}</span>
      <button data-testid="debug-button" onClick={() => props.onDebug()}>
        Debug
      </button>
      <button data-testid="panel-explain" onClick={() => props.executeExplainQuery()}>
        Explain
      </button>
    </div>
  ),
}))

vi.mock('@/components/interfaces/SQLEditor/RunQueryWarningModal', () => ({
  RunQueryWarningModal: (props: any) =>
    props.visible ? (
      <div data-testid="warning-modal">
        <button data-testid="warn-confirm" onClick={props.onConfirm}>
          Confirm
        </button>
        <button data-testid="warn-confirm-rls" onClick={props.onConfirmWithRLS}>
          Confirm RLS
        </button>
        <button data-testid="warn-cancel" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}))

// --- Context / selection hook stubs (orthogonal infra, not under test) ------

vi.mock('@/components/interfaces/SQLEditor/useAddDefinitions', () => ({
  useAddDefinitions: () => {},
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: {
      id: 1,
      ref: 'default',
      connectionString: 'postgresql://postgres@localhost:5432/postgres',
    },
  }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'test-org' } }),
}))

vi.mock('@/hooks/misc/useOrgOptedIntoAi', () => ({
  useOrgAiOptInLevel: () => ({
    aiOptInLevel: 'disabled',
    includeSchemaMetadata: false,
    isHipaaProjectDisallowed: false,
  }),
}))

vi.mock('@/data/read-replicas/replicas-query', () => ({
  useReadReplicasQuery: () => ({
    data: [
      {
        identifier: 'default',
        connectionString: 'postgresql://postgres@localhost:5432/postgres',
      },
    ],
    isSuccess: true,
  }),
}))

vi.mock('@/data/database-event-triggers/database-event-triggers-query', () => ({
  useDatabaseEventTriggersQuery: () => ({ data: undefined }),
}))

// `common` is globally mocked in vitestSetup to `{ ref: 'default' }`. Re-mock it
// here to also provide a snippet id (so `id` is stable and points at our seeded
// snippet) and a stable `useFlag`.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default', id: SNIPPET_ID }),
    useFlag: () => false,
  }
})

// --- Helpers ----------------------------------------------------------------

function seedSnippet(sql: string, name = 'My query') {
  ;(sqlEditorState.snippets as any)[SNIPPET_ID] = {
    projectRef: 'default',
    splitSizes: [50, 50],
    snippet: {
      id: SNIPPET_ID,
      name,
      project_id: 1,
      owner_id: 1,
      content: { sql, unchecked_sql: sql, schema_version: '1.0', favorite: false },
    },
  }
}

function resetStores() {
  for (const key of Object.keys(sqlEditorState.snippets)) {
    delete (sqlEditorState.snippets as any)[key]
  }
  for (const key of Object.keys(sqlEditorSessionState.results)) {
    delete (sqlEditorSessionState.results as any)[key]
  }
  sqlEditorDiffRequestState.pending = undefined
}

const NON_EXPLAIN_ROWS = [{ id: 1, name: 'row-1' }]
const EXPLAIN_ROWS = [{ 'QUERY PLAN': 'Seq Scan on foo (cost=0.00..1.00 rows=1 width=4)' }]

function mockQuerySuccess(rows: unknown[] = NON_EXPLAIN_ROWS) {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<any>(rows),
  })
}

function mockQueryError(body: Record<string, unknown>) {
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<any>(body, { status: 400 }),
  })
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(0), 0) as unknown as number
  })
  resetStores()
  seedSnippet('select 1;')
  mocks.state.value = 'select 1;'
  mocks.state.selection = null
  mocks.state.selectionValue = undefined
  mocks.state.decorations = ['decoration-1']
  mocks.editor.executeEdits.mockClear()
  mocks.editor.deltaDecorations.mockClear()
  mocks.editor.revealLineInCenter.mockClear()
  mocks.editor.focus.mockClear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function renderEditor() {
  const utils = customRender(<SQLEditor />)
  // The Monaco editor is loaded via next/dynamic; wait for the fake to mount.
  await screen.findByTestId('monaco-editor')
  return utils
}

describe('SQLEditor characterization', () => {
  test('1a. successful run adds result and keeps Results tab active', async () => {
    const addResult = vi.spyOn(sqlEditorSessionState, 'addResult')
    mockQuerySuccess(NON_EXPLAIN_ROWS)

    await renderEditor()
    expect(screen.getByTestId('active-tab')).toHaveTextContent('results')

    fireEvent.click(screen.getByTestId('editor-run'))

    await waitFor(() => expect(addResult).toHaveBeenCalled())
    // The snippet id and rows are the load-bearing part; autoLimit is derived
    // from the (SELECT) query + configured row limit and is asserted loosely.
    expect(addResult.mock.calls[0][0]).toBe(SNIPPET_ID)
    expect(addResult.mock.calls[0][1]).toEqual(NON_EXPLAIN_ROWS)
    expect(screen.getByTestId('active-tab')).toHaveTextContent('results')
  })

  test('1b. an EXPLAIN-shaped result auto-switches to the explain tab', async () => {
    const addExplainResult = vi.spyOn(sqlEditorSessionState, 'addExplainResult')
    mockQuerySuccess(EXPLAIN_ROWS)

    await renderEditor()

    fireEvent.click(screen.getByTestId('editor-run'))

    await waitFor(() => expect(addExplainResult).toHaveBeenCalledWith(SNIPPET_ID, EXPLAIN_ROWS))
    await waitFor(() => expect(screen.getByTestId('active-tab')).toHaveTextContent('explain'))
  })

  test('1c. running a non-EXPLAIN query while on the explain tab switches back to results', async () => {
    await renderEditor()

    // First run an EXPLAIN-shaped query to land on the explain tab.
    mockQuerySuccess(EXPLAIN_ROWS)
    fireEvent.click(screen.getByTestId('editor-run'))
    await waitFor(() => expect(screen.getByTestId('active-tab')).toHaveTextContent('explain'))

    // Now a normal query should flip back to results.
    mockQuerySuccess(NON_EXPLAIN_ROWS)
    fireEvent.click(screen.getByTestId('editor-run'))
    await waitFor(() => expect(screen.getByTestId('active-tab')).toHaveTextContent('results'))
  })

  test('2. run error with position highlights the computed line and reveals it', async () => {
    const addResultError = vi.spyOn(sqlEditorSessionState, 'addResultError')
    mockQueryError({
      message: 'syntax error',
      position: '8',
      formattedError: 'ERROR:  syntax error at or near "slect"\nLINE 3: slect 1;\n        ^',
    })

    await renderEditor()

    fireEvent.click(screen.getByTestId('editor-run'))

    await waitFor(() => expect(mocks.editor.deltaDecorations).toHaveBeenCalled())

    // With no selection, startLineNumber is 0 → highlighted line === parsed LINE (3).
    const [oldDecorations, newDecorations] = mocks.editor.deltaDecorations.mock.calls[0]
    expect(oldDecorations).toEqual([])
    expect(newDecorations[0].range.startLineNumber).toBe(3)
    expect(newDecorations[0].range.endLineNumber).toBe(3)
    expect(mocks.editor.revealLineInCenter).toHaveBeenCalledWith(3)
    await waitFor(() => expect(addResultError).toHaveBeenCalled())
  })

  test('2b. the next run clears the previously-set line highlights', async () => {
    // First: produce a highlight.
    mockQueryError({
      message: 'syntax error',
      position: '8',
      formattedError: 'ERROR:  syntax error\nLINE 2: foo\n',
    })
    await renderEditor()
    fireEvent.click(screen.getByTestId('editor-run'))
    await waitFor(() => expect(mocks.editor.deltaDecorations).toHaveBeenCalledTimes(1))

    // Second run should clear the stored decorations before running again.
    mockQuerySuccess(NON_EXPLAIN_ROWS)
    fireEvent.click(screen.getByTestId('editor-run'))
    await waitFor(() =>
      expect(mocks.editor.deltaDecorations).toHaveBeenCalledWith(['decoration-1'], [])
    )
  })

  test('3. running via the run button refocuses the editor', async () => {
    mockQuerySuccess(NON_EXPLAIN_ROWS)
    await renderEditor()

    fireEvent.click(screen.getByTestId('run-button'))

    await waitFor(() => expect(mocks.editor.focus).toHaveBeenCalled())
  })

  test('3b. run button is disabled and short-circuits while a diff is open', async () => {
    // Queue a diff request against a non-empty editor so a diff opens on mount.
    mocks.state.value = 'select 1;'
    sqlEditorDiffRequestState.requestDiff('select 42;', DiffType.Modification)

    await renderEditor()
    await screen.findByTestId('diff-editor')

    const addResult = vi.spyOn(sqlEditorSessionState, 'addResult')
    // The run button is disabled while diffing; clicking should not execute.
    expect(screen.getByTestId('run-button')).toBeDisabled()
    fireEvent.click(screen.getByTestId('run-button'))
    // Give any async work a chance to (not) happen.
    await new Promise((r) => setTimeout(r, 20))
    expect(addResult).not.toHaveBeenCalled()
  })

  test('4. a diff request queued before mount drains exactly once', async () => {
    // Empty editor → drain copies the SQL in via executeEdits('apply-ai-message').
    mocks.state.value = ''
    sqlEditorDiffRequestState.requestDiff('select 100;', DiffType.Modification)

    const { unmount } = await renderEditor()

    await waitFor(() =>
      expect(mocks.editor.executeEdits).toHaveBeenCalledWith('apply-ai-message', expect.any(Array))
    )
    expect(mocks.editor.executeEdits).toHaveBeenCalledTimes(1)
    // Request was consumed (drained), so it cannot re-apply.
    expect(sqlEditorDiffRequestState.pending).toBeUndefined()

    // A fresh mount must NOT re-apply the already-consumed request.
    unmount()
    await renderEditor()
    await new Promise((r) => setTimeout(r, 20))
    expect(mocks.editor.executeEdits).toHaveBeenCalledTimes(1)
  })

  test('5. the ask-ai widget renders only while the prompt is open', async () => {
    mocks.state.value = 'select 1;'
    await renderEditor()

    expect(screen.queryByTestId('ask-ai')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('editor-prompt'))
    expect(await screen.findByTestId('ask-ai')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ask-ai-cancel'))
    await waitFor(() => expect(screen.queryByTestId('ask-ai')).not.toBeInTheDocument())
  })

  test('6. a destructive query opens the warning modal; confirm re-runs forced', async () => {
    mocks.state.value = 'drop table foo;'
    let forcedQuery = ''
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        forcedQuery = body.query
        return HttpResponse.json<any>(NON_EXPLAIN_ROWS)
      },
    })

    await renderEditor()

    fireEvent.click(screen.getByTestId('editor-run'))

    // Destructive query → confirmation modal, and no query is sent yet.
    expect(await screen.findByTestId('warning-modal')).toBeInTheDocument()
    expect(forcedQuery).toBe('')

    // Confirming forces the (same) destructive query to actually run.
    fireEvent.click(screen.getByTestId('warn-confirm'))
    await waitFor(() => expect(forcedQuery).toMatch(/drop table foo/i))
  })

  test('6b. confirm-with-RLS re-runs with appended enable-RLS statements', async () => {
    mocks.state.value = 'create table foo (id int);'
    let capturedQuery = ''
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const body = (await request.json()) as { query: string }
        capturedQuery = body.query
        return HttpResponse.json<any>(NON_EXPLAIN_ROWS)
      },
    })

    await renderEditor()

    fireEvent.click(screen.getByTestId('editor-run'))
    expect(await screen.findByTestId('warning-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('warn-confirm-rls'))
    await waitFor(() => expect(capturedQuery).toMatch(/enable row level security/i))
  })
})
