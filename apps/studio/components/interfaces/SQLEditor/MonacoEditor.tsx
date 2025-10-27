import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { useRouter } from 'next/router'
import { MutableRefObject, useEffect, useRef, useState } from 'react'

import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useTabsStateSnapshot } from 'state/tabs'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns'
import { untitledSnippetTitle } from './SQLEditor.constants'
import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'

export type MonacoEditorProps = {
  id: string
  className?: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<Monaco | null>
  autoFocus?: boolean
  executeQuery: () => void
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
  editorRef,
  monacoRef,
  autoFocus = true,
  placeholder = '',
  className,
  executeQuery,
  onHasSelection,
  onPrompt,
  onMount,
}: MonacoEditorProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, content } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  // [Joshen] Lodash debounce doesn't seem to be working here, so opting to use useDebounce
  const [value, setValue] = useState('')
  const debouncedValue = useDebounce(value, 1000)

  const snippet = snapV2.snippets[id]
  const disableEdit =
    snippet?.snippet.visibility === 'project' && snippet?.snippet.owner_id !== profile?.id

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const handleEditorOnMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const model = editorRef.current.getModel()
    if (model !== null) {
      monacoRef.current.editor.setModelMarkers(model, 'owner', [])
    }

    editor.addAction({
      id: 'run-query',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        executeQueryRef.current()
      },
    })

    editor.addAction({
      id: 'save-query',
      label: 'Save Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyS],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        if (snippet) snapV2.addNeedsSaving(snippet.snippet.id)
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
        aiSnap.newChat({
          name: 'Explain code section',
          open: true,
          sqlSnippets: [selectedValue],
          initialInput: 'Can you explain this section to me in more detail?',
        })
      },
    })

    if (onPrompt) {
      editor.addAction({
        id: 'generate-sql',
        label: 'Generate SQL',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
        run: () => {
          const selection = editor.getSelection()
          const model = editor.getModel()
          if (!model || !selection) return

          const allLines = model.getLinesContent()

          const startLineIndex = selection.startLineNumber - 1
          const endLineIndex = selection.endLineNumber

          const beforeSelection = allLines.slice(0, startLineIndex).join('\n') + '\n'
          const selectedText = allLines.slice(startLineIndex, endLineIndex).join('\n')
          const afterSelection = '\n' + allLines.slice(endLineIndex).join('\n')

          onPrompt({
            selection: selectedText,
            beforeSelection,
            afterSelection,
            startLineNumber: selection?.startLineNumber ?? 0,
            endLineNumber: selection?.endLineNumber ?? 0,
          })
        },
      })
    }

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
      if (!!snippet) {
        setValue(value)
      } else if (ref && !!profile && !!project) {
        const snippet = createSqlSnippetSkeletonV2({
          id,
          name: untitledSnippetTitle,
          sql: value,
          owner_id: profile?.id,
          project_id: project?.id,
        })
        snapV2.addSnippet({ projectRef: ref, snippet })
        router.push(`/project/${ref}/sql/${snippet.id}`, undefined, { shallow: true })
      }
    }
  }

  useEffect(() => {
    if (debouncedValue.length > 0 && snippet) {
      snapV2.setSql(id, value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

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
          className="m-0 py-2 rounded-none border-0 border-b [&>h5]:mb-0.5"
          title="This snippet has been shared to the project and is only editable by the owner who created this snippet"
          description='You may duplicate this snippet into a personal copy by right clicking on the snippet and selecting "Duplicate query"'
        />
      )}
      <Editor
        className={cn(className, 'monaco-editor')}
        theme={'supabase'}
        onMount={handleEditorOnMount}
        onChange={handleEditorChange}
        defaultLanguage="pgsql"
        defaultValue={snippet?.snippet.content?.sql}
        path={id}
        options={{
          tabSize: 2,
          fontSize: 13,
          placeholder,
          lineDecorationsWidth: 0,
          readOnly: disableEdit,
          minimap: { enabled: false },
          wordWrap: 'on',
          padding: { top: 4 },
          // [Joshen] Commenting the following out as it causes the autocomplete suggestion popover
          // to be positioned wrongly somehow. I'm not sure if this affects anything though, but leaving
          // comment just in case anyone might be wondering. Relevant issues:
          // - https://github.com/microsoft/monaco-editor/issues/2229
          // - https://github.com/microsoft/monaco-editor/issues/2503
          // fixedOverflowWidgets: true,
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
