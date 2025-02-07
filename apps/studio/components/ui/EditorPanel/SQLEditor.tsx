import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Loader2, Book, Command } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { Button, cn, Input_Shadcn_, SQL_ICON } from 'ui'
import { Admonition } from 'ui-patterns'
import { useParams } from 'common'
import { IStandaloneCodeEditor } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { suffixWithLimit } from 'components/interfaces/SQLEditor/SQLEditor.utils'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useAppStateSnapshot } from 'state/app-state'
import { detectOS } from 'lib/helpers'
import InlineWidget from 'components/interfaces/SQLEditor/InlineWidget'
import { AskAIWidget } from 'components/interfaces/SQLEditor/AskAIWidget'
import { useCompletion } from 'ai/react'
import { BASE_PATH } from 'lib/constants'
import { constructHeaders } from 'data/fetchers'
import { toast } from 'sonner'

interface SQLEditorProps {
  onChange?: (value: string) => void
}

const SQLEditor = ({ onChange }: SQLEditorProps) => {
  const { ref } = useParams()
  const project = useSelectedProject()
  const { editorPanel, setEditorPanel } = useAppStateSnapshot()
  const os = detectOS()

  const [error, setError] = useState<QueryResponseError>()
  const [results, setResults] = useState<undefined | any[]>(undefined)
  const [showResults, setShowResults] = useState(false)
  const [showWarning, setShowWarning] = useState<boolean>(false)
  const [currentValue, setCurrentValue] = useState(editorPanel.initialValue || '')
  const [showTemplates, setShowTemplates] = useState(false)
  const [promptInput, setPromptInput] = useState('')
  const [isCompletionLoading, setIsCompletionLoading] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const [promptState, setPromptState] = useState({
    isOpen: false,
    selection: '',
    beforeSelection: '',
    afterSelection: '',
    startLineNumber: 0,
    endLineNumber: 0,
  })

  const editorRef = useRef<IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<any | null>(null)

  const {
    complete,
    completion,
    isLoading: isAiLoading,
  } = useCompletion({
    api: `${BASE_PATH}/api/ai/sql/complete`,
    body: {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      includeSchemaMetadata: true,
    },
    onResponse: (response) => {
      if (!response.ok) throw new Error('Failed to generate completion')
    },
    onError: (error) => {
      toast.error(`Failed to generate SQL: ${error.message}`)
    },
  })

  const numResults = (results ?? []).length
  const [errorHeader, ...errorContent] =
    (error?.formattedError?.split('\n') ?? [])?.filter((x: string) => x.length > 0) ?? []

  const { mutate: executeSql, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: async (res) => {
      setShowResults(true)
      setResults(res.result)
    },
    onError: (error) => {
      setError(error)
      setResults([])
    },
  })

  const onExecuteSql = (skipValidation = false) => {
    setError(undefined)
    setShowWarning(false)

    if (currentValue.length === 0) return

    if (editorPanel.onSave) {
      editorPanel.onSave(currentValue)
    }

    executeSql({
      sql: suffixWithLimit(currentValue, 100),
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      handleError: (error) => {
        throw error
      },
    })
  }

  const handleChange = (value?: string) => {
    const newValue = value || ''
    setCurrentValue(newValue)
    onChange?.(newValue)
  }

  const onSelectTemplate = (content: string) => {
    handleChange(content)
    setShowTemplates(false)
  }

  const handleEditorOnMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.addAction({
      id: 'run-query',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: () => {
        onExecuteSql()
      },
    })

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

        setPromptState({
          isOpen: true,
          selection: selectedText,
          beforeSelection,
          afterSelection,
          startLineNumber: selection?.startLineNumber ?? 0,
          endLineNumber: selection?.endLineNumber ?? 0,
        })
      },
    })
  }

  const handlePrompt = async (
    prompt: string,
    context: {
      beforeSelection: string
      selection: string
      afterSelection: string
    }
  ) => {
    try {
      setIsCompletionLoading(true)
      setPromptState((prev) => ({
        ...prev,
        selection: context.selection,
        beforeSelection: context.beforeSelection,
        afterSelection: context.afterSelection,
      }))

      const headerData = await constructHeaders()

      await complete(prompt, {
        headers: { Authorization: headerData.get('Authorization') ?? '' },
        body: {
          completionMetadata: {
            textBeforeCursor: context.beforeSelection,
            textAfterCursor: context.afterSelection,
            language: 'pgsql',
            prompt,
            selection: context.selection,
          },
        },
      })
    } catch (error) {
      setPromptState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    if (!completion) return

    const original =
      promptState.beforeSelection + promptState.selection + promptState.afterSelection
    const modified = promptState.beforeSelection + completion + promptState.afterSelection

    if (editorRef.current) {
      const editor = editorRef.current
      const model = editor.getModel()
      if (model) {
        editor.executeEdits('apply-ai-edit', [
          {
            text: modified,
            range: model.getFullModelRange(),
          },
        ])
      }
    }

    setPromptState((prev) => ({ ...prev, isOpen: false }))
    setPromptInput('')
    setIsCompletionLoading(false)
  }, [completion, promptState.beforeSelection, promptState.selection, promptState.afterSelection])

  const handleAcceptAI = () => {
    // TODO: Implement accept AI changes
    setPromptState((prev) => ({ ...prev, isOpen: false }))
    setPromptInput('')
  }

  const handleRejectAI = () => {
    setPromptState((prev) => ({ ...prev, isOpen: false }))
    setPromptInput('')
  }

  const filteredTemplates = editorPanel.templates?.filter((template) => {
    const searchLower = templateSearch.toLowerCase()
    return (
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower)
    )
  })

  console.log('templates:', editorPanel.templates)

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full">
      <div className="flex-1 min-h-0 relative">
        <div className="w-full h-full relative">
          <Editor
            className="monaco-editor"
            theme="supabase"
            language="pgsql"
            defaultValue={editorPanel.initialValue}
            onChange={handleChange}
            onMount={handleEditorOnMount}
            options={{
              tabSize: 2,
              fontSize: 13,
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: false,
              padding: { top: 4 },
              lineNumbersMinChars: 3,
            }}
          />
          {editorRef.current && promptState.isOpen && (
            <InlineWidget
              editor={editorRef.current}
              id="ask-ai"
              afterLineNumber={promptState.endLineNumber}
              beforeLineNumber={Math.max(0, promptState.startLineNumber - 1)}
              heightInLines={2}
            >
              <AskAIWidget
                value={promptInput}
                onChange={setPromptInput}
                onSubmit={(prompt: string) => {
                  handlePrompt(prompt, {
                    beforeSelection: promptState.beforeSelection,
                    selection: promptState.selection,
                    afterSelection: promptState.afterSelection,
                  })
                }}
                onAccept={handleAcceptAI}
                onReject={handleRejectAI}
                isDiffVisible={false}
                isLoading={isCompletionLoading}
              />
            </InlineWidget>
          )}
          <AnimatePresence>
            {!promptState.isOpen && !currentValue && (
              <motion.p
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                className="text-foreground-lighter absolute bottom-4 left-4 z-10 font-mono text-xs flex items-center gap-1"
              >
                Hit {os === 'macos' ? <Command size={12} /> : `CTRL+`}K to edit with the Assistant
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      {showTemplates && editorPanel.templates && (
        <div className="bg-surface-100 border-t w-full flex flex-col max-h-80 h-full bg-surface-75 text-sm">
          <div className="px-4 py-3 border-b shrink-0">
            <Input_Shadcn_
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
            />
          </div>
          <div className="overflow-auto flex-1">
            {filteredTemplates?.map((template, i) => (
              <div
                key={i}
                className="cursor-pointer group border-b flex items-center gap-4 px-4 py-3 hover:bg-surface-200"
                onClick={() => onSelectTemplate(template.content)}
              >
                <SQL_ICON
                  size={18}
                  strokeWidth={1.5}
                  className={cn(
                    'transition-colors fill-foreground-muted group-aria-selected:fill-foreground',
                    'w-5 h-5 shrink-0 grow-0 -ml-0.5'
                  )}
                />
                <div>
                  <p className="text-xs mb-1">{template.name}</p>
                  <p className="text-xs text-foreground-light">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {error !== undefined && (
        <div className="shrink-0">
          <Admonition
            type="warning"
            className="m-0 rounded-none border-x-0 border-b-0 [&>div>div>pre]:text-sm [&>div]:flex [&>div]:flex-col [&>div]:gap-y-2"
            title={errorHeader || 'Error running SQL query'}
            description={
              <div>
                {errorContent.length > 0 ? (
                  errorContent.map((errorText: string, i: number) => (
                    <pre key={`err-${i}`} className="font-mono text-xs whitespace-pre-wrap">
                      {errorText}
                    </pre>
                  ))
                ) : (
                  <p className="font-mono text-xs">{error.error}</p>
                )}
              </div>
            }
          />
        </div>
      )}

      {results !== undefined && results.length > 0 && (
        <div className="h-72 shrink-0 flex flex-col">
          <div className="border-t flex-1">
            <Results rows={results} />
          </div>
          <p className="shrink-0 text-xs text-foreground-light font-mono py-2 px-5">
            {results.length} rows
            {results.length >= 100 && ` (Limited to only 100 rows)`}
          </p>
        </div>
      )}
      {results !== undefined && results.length === 0 && (
        <div className="shrink-0">
          <p className="text-xs text-foreground-light font-mono py-2 px-5">
            Success. No rows returned.
          </p>
        </div>
      )}
      <div className="z-10 bg-surface-100 flex items-center gap-2 !justify-between px-5 py-4 w-full border-t shrink-0">
        <Button
          size="tiny"
          type="default"
          onClick={() => setShowTemplates(!showTemplates)}
          icon={<Book size={14} />}
        >
          {showTemplates ? 'Hide templates' : 'Show templates'}
        </Button>
        <Button
          loading={isExecuting}
          onClick={() => onExecuteSql()}
          iconRight={
            isExecuting ? (
              <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
            ) : (
              <div className="flex items-center space-x-1">
                <CornerDownLeft size={10} strokeWidth={1.5} />
              </div>
            )
          }
        >
          Run
        </Button>
      </div>
    </div>
  )
}

export default SQLEditor
