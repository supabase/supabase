import Editor, { DiffEditor, Monaco, OnMount } from '@monaco-editor/react'
import { useCompletion } from 'ai/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Command } from 'lucide-react'
import { editor as monacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { constructHeaders } from 'data/fetchers'
import { detectOS } from 'lib/helpers'
import ResizableAIWidget from './ResizableAIWidget'

interface AIEditorProps {
  id?: string
  language?: string
  value?: string
  defaultValue?: string
  aiEndpoint?: string
  aiMetadata?: {
    projectRef?: string
    connectionString?: string
    includeSchemaMetadata?: boolean
  }
  initialPrompt?: string
  readOnly?: boolean
  className?: string
  options?: monacoEditor.IStandaloneEditorConstructionOptions
  onChange?: (value: string) => void
  executeQuery?: () => void
}

// [Joshen] This has overlap with components/interfaces/SQLEditor/MonacoEditor
// Can we try to de-dupe accordingly? Perhaps the SQL Editor could use this AIEditor
// We have a tendency to create multiple versions of the monaco editor like RLSCodeEditor
// so hoping to prevent that from snowballing
const AIEditor = ({
  language = 'javascript',
  value,
  defaultValue = '',
  aiEndpoint,
  aiMetadata,
  initialPrompt,
  readOnly = false,
  className = '',
  options = {},
  onChange,
  executeQuery,
}: AIEditorProps) => {
  const os = detectOS()
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<monacoEditor.IStandaloneDiffEditor | null>(null)

  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const [currentValue, setCurrentValue] = useState(value || defaultValue)
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [isDiffEditorMounted, setIsDiffEditorMounted] = useState(false)
  const [diffValue, setDiffValue] = useState({ original: '', modified: '' })
  const [promptState, setPromptState] = useState({
    isOpen: Boolean(initialPrompt),
    selection: '',
    beforeSelection: '',
    afterSelection: '',
    startLineNumber: 0,
    endLineNumber: 0,
  })
  const [promptInput, setPromptInput] = useState(initialPrompt || '')

  const {
    complete,
    completion,
    isLoading: isCompletionLoading,
    setCompletion,
  } = useCompletion({
    api: aiEndpoint || '',
    body: aiMetadata,
    onResponse: (response) => {
      if (!response.ok) throw new Error('Failed to generate completion')
    },
    onError: (error) => {
      toast.error(`Failed to generate: ${error.message}`)
    },
  })

  const handleReset = useCallback(() => {
    setCompletion('')
    setIsDiffMode(false)
    setPromptState((prev) => ({ ...prev, isOpen: false }))
    setPromptInput('')
    editorRef.current?.focus()
  }, [setCompletion])

  const handleAcceptDiff = useCallback(() => {
    if (diffValue.modified) {
      const newValue = diffValue.modified
      setCurrentValue(newValue)
      onChange?.(newValue)
      handleReset()
    }
  }, [diffValue.modified, onChange, handleReset])

  const handleRejectDiff = () => {
    handleReset()
  }

  const handleEditorOnMount: OnMount = (
    editor: monacoEditor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor
    // Set prompt state to open if promptInput exists
    if (promptInput) {
      const model = editor.getModel()
      if (model) {
        const lineCount = model.getLineCount()
        setPromptState({
          isOpen: true,
          selection: model.getValue(),
          beforeSelection: '',
          afterSelection: '',
          startLineNumber: 1,
          endLineNumber: lineCount,
        })
      }
    }

    if (!!executeQueryRef.current) {
      editor.addAction({
        id: 'run-query',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
        contextMenuGroupId: 'operation',
        contextMenuOrder: 0,
        run: () => executeQueryRef.current?.(),
      })
    }

    editor.addAction({
      id: 'generate-ai',
      label: 'Generate with AI',
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
          ...aiMetadata,
          completionMetadata: {
            textBeforeCursor: context.beforeSelection,
            textAfterCursor: context.afterSelection,
            language,
            prompt,
            selection: context.selection,
          },
        },
      })
    } catch (error) {
      setPromptState((prev) => ({ ...prev, isOpen: false }))
    }
  }

  const defaultOptions: monacoEditor.IStandaloneEditorConstructionOptions = {
    tabSize: 2,
    fontSize: 13,
    readOnly,
    minimap: { enabled: false },
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: false,
    padding: { top: 4 },
    lineNumbersMinChars: 3,
    ...options,
  }

  useEffect(() => {
    setCurrentValue(value || defaultValue)
  }, [value, defaultValue])

  useEffect(() => {
    if (initialPrompt) {
      setPromptInput(initialPrompt)
      setPromptState({
        isOpen: Boolean(initialPrompt),
        selection: '',
        beforeSelection: '',
        afterSelection: '',
        startLineNumber: 0,
        endLineNumber: 0,
      })
    }
  }, [initialPrompt])

  useEffect(() => {
    if (!isDiffMode) {
      setIsDiffEditorMounted(false)
    }
  }, [isDiffMode])

  useEffect(() => {
    if (!completion) {
      setIsDiffMode(false)
      return
    }

    const original =
      promptState.beforeSelection + promptState.selection + promptState.afterSelection
    const modified = promptState.beforeSelection + completion + promptState.afterSelection

    setDiffValue({ original, modified })
    setIsDiffMode(true)
  }, [completion, promptState.beforeSelection, promptState.selection, promptState.afterSelection])

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleReset()
      } else if (
        event.key === 'Enter' &&
        (os === 'macos' ? event.metaKey : event.ctrlKey) &&
        isDiffMode
      ) {
        event.preventDefault()
        handleAcceptDiff()
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [os, isDiffMode, handleAcceptDiff, handleReset])

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full relative">
      {isDiffMode ? (
        <div className="w-full h-full">
          <DiffEditor
            theme="vs-dark"
            language={language}
            original={diffValue.original}
            modified={diffValue.modified}
            onMount={(editor: monacoEditor.IStandaloneDiffEditor) => {
              diffEditorRef.current = editor
              setIsDiffEditorMounted(true)
            }}
            options={{
              ...defaultOptions,
              renderSideBySide: false,
            }}
          />
          {isDiffEditorMounted && (
            <ResizableAIWidget
              editor={diffEditorRef.current!}
              id="ask-ai-diff"
              value={promptInput}
              onChange={setPromptInput}
              onSubmit={(prompt: string) => {
                handlePrompt(prompt, {
                  beforeSelection: promptState.beforeSelection,
                  selection: promptState.selection || diffValue.modified,
                  afterSelection: promptState.afterSelection,
                })
              }}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
              onCancel={handleReset}
              isDiffVisible={true}
              isLoading={isCompletionLoading}
              startLineNumber={Math.max(0, promptState.startLineNumber)}
              endLineNumber={promptState.endLineNumber}
            />
          )}
        </div>
      ) : (
        <div className="w-full h-full relative">
          <Editor
            theme="supabase"
            language={language}
            value={currentValue}
            options={defaultOptions}
            onChange={(value: string | undefined) => {
              const newValue = value || ''
              setCurrentValue(newValue)
              onChange?.(newValue)
            }}
            onMount={handleEditorOnMount}
            className={className}
          />
          {promptState.isOpen && editorRef.current && (
            <ResizableAIWidget
              editor={editorRef.current}
              id="ask-ai"
              value={promptInput}
              onChange={setPromptInput}
              onSubmit={(prompt: string) => {
                handlePrompt(prompt, {
                  beforeSelection: promptState.beforeSelection,
                  selection: promptState.selection,
                  afterSelection: promptState.afterSelection,
                })
              }}
              onCancel={handleReset}
              isDiffVisible={false}
              isLoading={isCompletionLoading}
              startLineNumber={Math.max(0, promptState.startLineNumber)}
              endLineNumber={promptState.endLineNumber}
            />
          )}
          <AnimatePresence>
            {!promptState.isOpen && !currentValue && aiEndpoint && (
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
      )}
    </div>
  )
}

export default AIEditor
