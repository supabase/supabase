import type { Monaco, OnMount } from '@monaco-editor/react'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { Admonition } from 'ui-patterns'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { getSnippetSqlFromContent } from './sqlSnippet.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AIEditor } from '@/components/ui/AIEditor'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { useTabsStateSnapshot } from '@/state/tabs'

export type MonacoEditorProps = {
  id: string
  snippetName: string
  className?: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<Monaco | null>
  autoFocus?: boolean
  executeQuery: () => void
  executeExplainQuery: () => void
  prettifyQuery: () => void
  onSaveQuery: () => void
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

const MonacoEditor = ({
  id,
  snippetName: _snippetName,
  editorRef,
  monacoRef,
  autoFocus = true,
  placeholder: _placeholder = '',
  className,
  executeQuery,
  executeExplainQuery,
  prettifyQuery,
  onSaveQuery,
  onHasSelection,
  onPrompt,
  onMount,
}: MonacoEditorProps) => {
  const { profile } = useProfile()
  const { content } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )
  const isAIAssistantHotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.AI_ASSISTANT_TOGGLE)
  const isCommandMenuHotkeyEnabled = useIsShortcutEnabled(SHORTCUT_IDS.COMMAND_MENU_OPEN)
  const setCommandMenuOpen = useSetCommandMenuOpen()

  // [Joshen] Lodash debounce doesn't seem to be working here, so opting to use local state
  const [value, setValue] = useState('')

  const snippet = snapV2.snippets[id]
  const disableEdit =
    snippet?.snippet.visibility === 'project' && snippet?.snippet.owner_id !== profile?.id

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const executeExplainQueryRef = useRef(executeExplainQuery)
  executeExplainQueryRef.current = executeExplainQuery

  const prettifyQueryRef = useRef(prettifyQuery)
  prettifyQueryRef.current = prettifyQuery

  const onSaveQueryRef = useRef(onSaveQuery)
  onSaveQueryRef.current = onSaveQuery

  const aiHotkeyEnabledRef = useRef(isAIAssistantHotkeyEnabled)
  aiHotkeyEnabledRef.current = isAIAssistantHotkeyEnabled

  const commandMenuHotkeyEnabledRef = useRef(isCommandMenuHotkeyEnabled)
  commandMenuHotkeyEnabledRef.current = isCommandMenuHotkeyEnabled

  const setCommandMenuOpenRef = useRef(setCommandMenuOpen)
  setCommandMenuOpenRef.current = setCommandMenuOpen

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const model = editorRef.current.getModel()
    if (model !== null) {
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
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

    editor.addAction({
      id: 'save-query',
      label: 'Save Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyS],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        onSaveQueryRef.current()
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
        const selectedValue = (editorRef?.current as any)
          .getModel()
          .getValueInRange((editorRef?.current as any)?.getSelection())
        openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        aiSnap.newChat({
          name: 'Explain code section',
          sqlSnippets: [selectedValue],
          initialInput: 'Can you explain this section to me in more detail?',
        })
      },
    })

    // Monaco claims Cmd+K as a chord prefix, which swallows the global command
    // menu shortcut while the editor is focused. Intercept it here and open the
    // command menu directly so it works the same inside and outside the editor.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      if (commandMenuHotkeyEnabledRef.current) {
        setCommandMenuOpenRef.current(true)
      }
    })

    editor.onDidChangeCursorSelection(({ selection }) => {
      const noSelection =
        selection.startLineNumber === selection.endLineNumber &&
        selection.startColumn === selection.endColumn
      onHasSelection(!noSelection)
    })

    if (autoFocus) {
      if (editor.getValue().length === 1) editor.setPosition({ lineNumber: 1, column: 2 })
      editor.focus()
    }

    onMount?.(editor)
  }

  function handleEditorChange(value: string | undefined) {
    tabsSnap.makeActiveTabPermanent()
    if (id && value) {
      setValue(value)
    }
  }

  useEffect(() => {
    const sql = getSnippetSqlFromContent(snippet?.snippet.content)
    if (sql) setValue(sql)
  }, [id, snippet?.snippet.content])

  // if an SQL query is passed by the content parameter, set the editor value to its content. This
  // is usually used for sending the user to SQL editor from other pages with SQL.
  useEffect(() => {
    if (content && content.length > 0) handleEditorChange(content)
  }, [])

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
      <AIEditor
        className={className}
        language="pgsql"
        autoFocus={autoFocus}
        readOnly={disableEdit}
        value={value || getSnippetSqlFromContent(snippet?.snippet.content)}
        onChange={handleEditorChange}
        onMount={handleEditorOnMount}
        executeQuery={executeQuery}
        onGenerateWithAI={onPrompt}
        aiEndpoint={onPrompt || !IS_PLATFORM ? undefined : `${BASE_PATH}/api/ai/code/complete`}
        aiMetadata={{
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          orgSlug: org?.slug,
          language: 'sql',
        }}
        openAIAssistantShortcutEnabled={isAIAssistantHotkeyEnabled}
        options={{
          tabSize: 2,
          fontSize: 13,
          lineDecorationsWidth: 10,
          minimap: { enabled: false },
          wordWrap: 'on',
          padding: { top: 4 },
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
      />
    </>
  )
}

export default MonacoEditor
