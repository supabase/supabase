import { Monaco, OnMount } from '@monaco-editor/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { noop } from 'lodash'
import { RefObject, useRef } from 'react'
import { Admonition } from 'ui-patterns/admonition'

import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { useSnippetEditor } from './useSnippetEditor'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { getEditorSelectionParts } from '@/components/ui/AIEditor/utils'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { useSqlEditorSaveCoordinator } from '@/state/sql-editor/sql-editor-save-coordinator'

export type MonacoEditorProps = {
  id: string
  snippetName: string
  className?: string
  editorRef: RefObject<IStandaloneCodeEditor | null>
  monacoRef: RefObject<Monaco | null>
  autoFocus?: boolean
  executeQuery: () => void
  executeExplainQuery: () => void
  showExplainAction?: boolean
  prettifyQuery: () => void
  onHasSelection: (value: boolean) => void
  onMount?: (editor: IStandaloneCodeEditor) => void
  onPrompt?: (value: {
    selection: string
    beforeSelection: string
    afterSelection: string
    startLineNumber: number
    endLineNumber: number
  }) => void
  placeholder?: string
}

export const MonacoEditor = ({
  id,
  snippetName,
  editorRef,
  monacoRef,
  autoFocus = true,
  placeholder = '',
  className,
  executeQuery,
  executeExplainQuery,
  showExplainAction = true,
  prettifyQuery,
  onHasSelection,
  onPrompt,
  onMount,
}: MonacoEditorProps) => {
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar, toggleSidebar } = useSidebarManagerSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const { snippet, disableEdit, handleEditorChange } = useSnippetEditor({ id, snippetName })

  // The Monaco save action is registered once on mount, but `snippet` starts
  // undefined for a new/deep-linked snippet and is only created on first edit.
  // Read it through a ref so Cmd/Ctrl+S sees the latest value, not the stale
  // mount-time closure.
  const snippetRef = useRef(snippet)
  snippetRef.current = snippet

  const executeExplainQueryRef = useRef(executeExplainQuery)
  executeExplainQueryRef.current = executeExplainQuery

  const prettifyQueryRef = useRef(prettifyQuery)
  prettifyQueryRef.current = prettifyQuery

  const isAIAssistantHotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.AI_ASSISTANT_TOGGLE)
  const aiHotkeyEnabledRef = useRef(isAIAssistantHotkeyEnabled)
  aiHotkeyEnabledRef.current = isAIAssistantHotkeyEnabled

  const { requestSave } = useSqlEditorSaveCoordinator()
  const requestSaveRef = useRef(requestSave)
  requestSaveRef.current = requestSave

  const handleEditorOnMount: OnMount = (editor, monaco) => {
    const model = editor.getModel()
    if (model !== null) {
      monaco.editor.setModelMarkers(model, 'owner', [])
    }

    // Blur the editor on Escape so users can hop out to the rest of the UI.
    // The precondition defers to Monaco's own Escape consumers (suggest widget,
    // find widget, parameter hints, snippet/rename mode, inline suggestions) and
    // to selection/multi-cursor cancellation, so inline features keep working.
    editor.addCommand(
      monaco.KeyCode.Escape,
      () => {
        ;(document.activeElement as HTMLElement | null)?.blur()
      },
      [
        'editorTextFocus',
        '!editorHasSelection',
        '!editorHasMultipleSelections',
        '!suggestWidgetVisible',
        '!findWidgetVisible',
        '!parameterHintsVisible',
        '!renameInputVisible',
        '!inSnippetMode',
        '!accessibilityHelpWidgetVisible',
        '!inlineSuggestionVisible',
      ].join(' && ')
    )

    if (showExplainAction) {
      editor.addAction({
        id: 'run-explain-query',
        label: 'Run EXPLAIN ANALYZE',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
        contextMenuGroupId: 'operation',
        contextMenuOrder: 1,
        run: () => {
          executeExplainQueryRef.current()
        },
      })
    }

    editor.addAction({
      id: 'save-query',
      label: 'Save Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyS],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        const currentSnippet = snippetRef.current
        if (currentSnippet) requestSaveRef.current(currentSnippet.snippet.id)
      },
    })

    editor.addAction({
      id: 'prettify-query',
      label: 'Prettify SQL',
      keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 2,
      run: () => {
        prettifyQueryRef.current()
      },
    })

    editor.addAction({
      id: 'explain-code',
      label: 'Explain Code',
      contextMenuGroupId: 'operation',
      contextMenuOrder: 1,
      run: () => {
        const selection = editorRef?.current?.getSelection()
        if (!selection) return

        const selectedValue = editorRef?.current?.getModel()?.getValueInRange(selection)

        openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        aiSnap.newChat({
          name: 'Explain code section',
          sqlSnippets: [selectedValue ?? ''],
          initialInput: 'Can you explain this section to me in more detail?',
        })
      },
    })

    editor.addAction({
      id: 'toggle-ai-assistant',
      label: 'Toggle AI Assistant',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyI],
      run: () => {
        if (aiHotkeyEnabledRef.current) {
          toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        }
      },
    })

    if (onPrompt) {
      editor.addAction({
        id: 'generate-sql',
        label: 'Generate SQL',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK],
        run: () => {
          const selectionParts = getEditorSelectionParts(editor)
          if (selectionParts) onPrompt(selectionParts)
        },
      })
    }

    editor.onDidChangeCursorSelection(({ selection }) => {
      const noSelection =
        selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn
      onHasSelection(!noSelection)
    })

    onMount?.(editor)
  }

  return (
    <>
      {disableEdit && (
        <Admonition
          type="default"
          className="rounded-none border-0 border-b"
          title="Read-only snippet"
          description="This snippet has been shared to the project and is only editable by the owner who created this snippet. You may duplicate this snippet into a personal copy by right clicking on the snippet and selecting “Duplicate query”."
        />
      )}
      <CodeEditor
        id={id}
        language="pgsql"
        className={className}
        autofocus={autoFocus}
        isReadOnly={disableEdit}
        defaultValue={snippet?.snippet.content?.unchecked_sql}
        editorRef={editorRef}
        monacoRef={monacoRef}
        actions={{
          runQuery: { enabled: true, callback: executeQuery },
          formatDocument: { enabled: false, callback: noop },
          placeholderFill: { enabled: false },
        }}
        options={{
          placeholder,
          lineDecorationsWidth: 0,
          fixedOverflowWidgets: false,
          lineNumbersMinChars: 5,
          scrollBeyondLastLine: true,
          suggest: {
            showMethods: intellisenseEnabled,
            showFunctions: intellisenseEnabled,
            showConstructors: intellisenseEnabled,
            showDeprecated: intellisenseEnabled,
            showFields: intellisenseEnabled,
            showVariables: intellisenseEnabled,
            showClasses: intellisenseEnabled,
            showStructs: intellisenseEnabled,
            showInterfaces: intellisenseEnabled,
            showModules: intellisenseEnabled,
            showProperties: intellisenseEnabled,
            showEvents: intellisenseEnabled,
            showOperators: intellisenseEnabled,
            showUnits: intellisenseEnabled,
            showValues: intellisenseEnabled,
            showConstants: intellisenseEnabled,
            showEnums: intellisenseEnabled,
            showEnumMembers: intellisenseEnabled,
            showKeywords: intellisenseEnabled,
            showWords: intellisenseEnabled,
            showColors: intellisenseEnabled,
            showFiles: intellisenseEnabled,
            showReferences: intellisenseEnabled,
            showFolders: intellisenseEnabled,
            showTypeParameters: intellisenseEnabled,
            showIssues: intellisenseEnabled,
            showUsers: intellisenseEnabled,
            showSnippets: intellisenseEnabled,
          },
        }}
        onInputChange={handleEditorChange}
        onMount={handleEditorOnMount}
      />
    </>
  )
}
