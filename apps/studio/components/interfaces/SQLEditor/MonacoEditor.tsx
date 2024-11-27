import Editor, { Monaco, OnMount, DiffEditor } from '@monaco-editor/react'
import { debounce } from 'lodash'
import { useRouter } from 'next/router'
import { MutableRefObject, useEffect, useRef, useState } from 'react'

import { useParams } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { cn } from 'ui'
import { untitledSnippetTitle } from './SQLEditor.constants'
import type { IStandaloneCodeEditor } from './SQLEditor.types'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'
import { useIsAssistantV2Enabled } from '../App/FeaturePreview/FeaturePreviewContext'
import { useAppStateSnapshot } from 'state/app-state'
import { registerCompletion } from 'monacopilot'

export type MonacoEditorProps = {
  id: string
  className?: string
  editorRef: MutableRefObject<IStandaloneCodeEditor | null>
  monacoRef: MutableRefObject<Monaco | null>
  autoFocus?: boolean
  autoComplete?: boolean
  executeQuery: () => void
  onHasSelection: (value: boolean) => void
  onPrompt: (params: {
    selection: string
    beforeSelection: string
    afterSelection: string
    replaceText: (text: string) => void
  }) => void
}

const MonacoEditor = ({
  id,
  editorRef,
  monacoRef,
  autoFocus = true,
  autoComplete = false,
  className,
  executeQuery,
  onHasSelection,
  onPrompt,
}: MonacoEditorProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, content } = useParams()
  const project = useSelectedProject()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const isAssistantV2Enabled = useIsAssistantV2Enabled()
  const { setAiAssistantPanel } = useAppStateSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const snippet = snapV2.snippets[id]

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const widgetRef = useRef<any>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [diffOriginal, setDiffOriginal] = useState('')
  const [diffModified, setDiffModified] = useState('')
  const diffEditorRef = useRef<any>(null)
  const [currentWidget, setCurrentWidget] = useState<any>(null)

  const setupContentWidget = (editor: any, monaco: any) => {
    if (currentWidget) {
      editor.removeContentWidget(currentWidget)
    }

    const widget = {
      getId: () => 'my.inline.widget',
      getDomNode: () => {
        if (!widgetRef.current) {
          widgetRef.current = document.createElement('div')
          widgetRef.current.className =
            'bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 flex flex-col gap-2 z-50'

          const updateWidgetContent = (showActions = false) => {
            widgetRef.current.innerHTML = ''

            if (!showActions) {
              // Input state
              const inputRow = document.createElement('div')
              inputRow.className = 'flex gap-2'

              const input = document.createElement('input')
              input.className = 'border rounded px-2 py-1 text-sm flex-1'
              input.placeholder = 'Enter text...'
              input.autofocus = true

              const button = document.createElement('button')
              button.className = 'bg-brand-600 text-white rounded px-3 py-1 text-sm'
              button.textContent = 'Generate'

              inputRow.appendChild(input)
              inputRow.appendChild(button)
              widgetRef.current.appendChild(inputRow)

              button.addEventListener('click', async () => {
                const selection = editor.getSelection()
                const model = editor.getModel()
                const selectedText = selection ? model?.getValueInRange(selection) : ''
                const input = widgetRef.current?.querySelector('input') as HTMLInputElement
                const inputValue = input?.value || ''

                const fullText = model?.getValue() || ''
                const beforeSelection = selection
                  ? fullText.substring(0, model?.getOffsetAt(selection.getStartPosition()) || 0)
                  : ''
                const afterSelection = selection
                  ? fullText.substring(model?.getOffsetAt(selection.getEndPosition()) || 0)
                  : ''

                fetch('/api/ai/monaco/complete', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    completionMetadata: {
                      textBeforeCursor: beforeSelection || '',
                      textAfterCursor: afterSelection || '',
                      language: 'pgsql',
                      prompt: inputValue,
                      selection: selectedText || '',
                    },
                  }),
                })
                  .then((response) => response.json())
                  .then((data) => {
                    if (data.completion && selection) {
                      const newText = beforeSelection + data.completion + afterSelection
                      setDiffOriginal(fullText)
                      setDiffModified(newText)
                      setShowDiff(true)
                      updateWidgetContent(true)
                    }
                  })
              })
            } else {
              // Action state
              const actionRow = document.createElement('div')
              actionRow.className = 'flex gap-2'

              const acceptButton = document.createElement('button')
              acceptButton.className =
                'px-3 py-1 text-sm rounded bg-brand-600 text-white hover:bg-brand-700'
              acceptButton.textContent = 'Accept'

              const rejectButton = document.createElement('button')
              rejectButton.className =
                'px-3 py-1 text-sm border rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              rejectButton.textContent = 'Reject'

              actionRow.appendChild(acceptButton)
              actionRow.appendChild(rejectButton)
              widgetRef.current.appendChild(actionRow)

              acceptButton.addEventListener('click', () => {
                handleEditorChange(diffModified)
                setShowDiff(false)
                editor.removeContentWidget(widget)
              })

              rejectButton.addEventListener('click', () => {
                setShowDiff(false)
                editor.removeContentWidget(widget)
              })
            }
          }

          updateWidgetContent()
        }
        return widgetRef.current
      },
      getPosition: () => ({
        position: editor.getPosition() || {
          lineNumber: 0,
          column: 0,
        },
        preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
      }),
    }

    setCurrentWidget(widget)

    editor.addAction({
      id: 'generate-sql',
      label: 'General SQL',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
        const position = editor.getPosition()
        if (!position) return

        if (currentWidget) {
          editor.removeContentWidget(currentWidget)
        }

        editor.addContentWidget(widget)
        setTimeout(() => {
          const input = widgetRef.current?.querySelector('input')
          if (input) input.focus()
        }, 0)
      },
    })

    return widget
  }

  const setupDiffContentWidget = (editor: any, monaco: any) => {
    const widget = {
      getId: () => 'diff.inline.widget',
      getDomNode: () => {
        if (!widgetRef.current) {
          widgetRef.current = document.createElement('div')
          widgetRef.current.className =
            'bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 flex gap-2 z-50'

          const acceptButton = document.createElement('button')
          acceptButton.className =
            'px-3 py-1 text-sm rounded bg-brand-600 text-white hover:bg-brand-700'
          acceptButton.textContent = 'Accept'

          const rejectButton = document.createElement('button')
          rejectButton.className =
            'px-3 py-1 text-sm border rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          rejectButton.textContent = 'Reject'

          acceptButton.addEventListener('click', () => {
            handleEditorChange(diffModified)
            setShowDiff(false)
            editor.removeContentWidget(widget)
          })

          rejectButton.addEventListener('click', () => {
            setShowDiff(false)
            editor.removeContentWidget(widget)
          })

          widgetRef.current.appendChild(acceptButton)
          widgetRef.current.appendChild(rejectButton)
        }
        return widgetRef.current
      },
      getPosition: () => ({
        position: {
          lineNumber: 1,
          column: 1,
        },
        preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
      }),
    }

    // Add the widget immediately
    editor.addContentWidget(widget)
    return widget
  }

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

    if (isAssistantV2Enabled) {
      editor.addAction({
        id: 'explain-code',
        label: 'Explain Code',
        contextMenuGroupId: 'operation',
        contextMenuOrder: 1,
        run: () => {
          const selectedValue = (editorRef?.current as any)
            .getModel()
            .getValueInRange((editorRef?.current as any)?.getSelection())
          setAiAssistantPanel({
            open: true,
            sqlSnippets: [selectedValue],
            initialInput: 'Can you explain this section to me in more detail?',
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

    // add margin above first line
    editorRef.current.changeViewZones((accessor) => {
      accessor.addZone({
        afterLineNumber: 0,
        heightInPx: 4,
        domNode: document.createElement('div'),
      })
    })

    if (autoFocus) {
      if (editor.getValue().length === 1) editor.setPosition({ lineNumber: 1, column: 2 })
      editor.focus()
    }

    if (autoComplete) {
      registerCompletion(monaco, editor, {
        endpoint: '/api/ai/monaco/complete',
        language: 'sql',
      })
    }

    setupContentWidget(editor, monaco)

    editor.addAction({
      id: 'generate-sql',
      label: 'General SQL',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
      run: () => {
        const selection = editor.getSelection()
        const model = editor.getModel()
        if (!model) return

        const selectedText = selection ? model.getValueInRange(selection) : ''
        const fullText = model.getValue()
        const beforeSelection = selection
          ? fullText.substring(0, model.getOffsetAt(selection.getStartPosition()))
          : ''
        const afterSelection = selection
          ? fullText.substring(model.getOffsetAt(selection.getEndPosition()))
          : ''

        onPrompt({
          selection: selectedText,
          beforeSelection,
          afterSelection,
        })
      },
    })
  }

  // [Joshen] Also needs updating here
  const debouncedSetSql = debounce((id, value) => {
    snapV2.setSql(id, value)
  }, 1000)

  function handleEditorChange(value: string | undefined) {
    const snippetCheck = snapV2.snippets[id]

    if (id && value) {
      if (snippetCheck) {
        debouncedSetSql(id, value)
      } else {
        if (ref && profile !== undefined && project !== undefined) {
          const snippet = createSqlSnippetSkeletonV2({
            id,
            name: untitledSnippetTitle,
            sql: value,
            owner_id: profile?.id,
            project_id: project?.id,
          })
          snapV2.addSnippet({ projectRef: ref, snippet })
          snapV2.addNeedsSaving(snippet.id)
          router.push(`/project/${ref}/sql/${snippet.id}`, undefined, { shallow: true })
        }
      }
    }
  }

  // if an SQL query is passed by the content parameter, set the editor value to its content. This
  // is usually used for sending the user to SQL editor from other pages with SQL.
  useEffect(() => {
    if (content && content.length > 0) {
      handleEditorChange(content)
    }
  }, [])

  return (
    <div className="relative h-full">
      <Editor
        className={cn(className, 'monaco-editor')}
        theme={'supabase'}
        onMount={handleEditorOnMount}
        onChange={handleEditorChange}
        defaultLanguage="pgsql"
        defaultValue={snippet?.snippet.content.sql}
        path={id}
        options={{
          tabSize: 2,
          fontSize: 13,
          minimap: { enabled: false },
          wordWrap: 'on',
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
      {showDiff && (
        <div className="absolute inset-0">
          <DiffEditor
            height="100%"
            language="pgsql"
            original={diffOriginal}
            modified={diffModified}
            theme="supabase"
            onMount={(editor, monaco) => {
              diffEditorRef.current = editor
              const modifiedEditor = editor.getModifiedEditor()

              // Setup the diff-specific widget
              const widget = setupDiffContentWidget(modifiedEditor, monaco)
              widgetRef.current = widget
            }}
            options={{
              renderSideBySide: false,
              readOnly: true,
              minimap: { enabled: false },
              wordWrap: 'on',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default MonacoEditor
