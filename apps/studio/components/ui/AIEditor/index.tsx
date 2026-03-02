import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { constructHeaders } from 'data/fetchers'
import { AnimatePresence, motion } from 'framer-motion'
import { detectOS } from 'lib/helpers'
import { Command } from 'lucide-react'
import type { editor as monacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

import { DiffEditor } from '../DiffEditor'
import ResizableAIWidget from './ResizableAIWidget'

interface AIEditorProps {
  id?: string
  language?: string
  value?: string
  defaultValue?: string
  aiEndpoint?: string
  aiMetadata?: {
    projectRef?: string
    connectionString?: string | null
    orgSlug?: string
  }
  initialPrompt?: string
  readOnly?: boolean
  autoFocus?: boolean
  className?: string
  options?: monacoEditor.IStandaloneEditorConstructionOptions
  onChange?: (value: string) => void
  onClose?: () => void
  closeShortcutEnabled?: boolean
  openAIAssistantShortcutEnabled?: boolean
  executeQuery?: () => void
  onMount?: (editor: monacoEditor.IStandaloneCodeEditor, monaco: Monaco) => void
}

// [Joshen] This has overlap with components/interfaces/SQLEditor/MonacoEditor
// Can we try to de-dupe accordingly? Perhaps the SQL Editor could use this AIEditor
// We have a tendency to create multiple versions of the monaco editor like RLSCodeEditor
// so hoping to prevent that from snowballing
export const AIEditor = ({
  language = 'javascript',
  value,
  defaultValue = '',
  aiEndpoint,
  aiMetadata,
  initialPrompt,
  readOnly = false,
  autoFocus = false,
  className = '',
  options = {},
  onChange,
  onClose,
  closeShortcutEnabled = true,
  openAIAssistantShortcutEnabled = true,
  executeQuery,
  onMount,
}: AIEditorProps) => {
  const os = detectOS()
  const { toggleSidebar } = useSidebarManagerSnapshot()
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null)
  const diffEditorRef = useRef<monacoEditor.IStandaloneDiffEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const closeActionDisposableRef = useRef<{ dispose: () => void } | null>(null)

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

  const [isCompletionLoading, setIsCompletionLoading] = useState(false)

  const complete = useCallback(
    async (
      prompt: string,
      options?: {
        headers?: Record<string, string>
        body?: { completionMetadata?: any }
      }
    ) => {
      try {
        if (!aiEndpoint) throw new Error('AI endpoint is not configured')
        setIsCompletionLoading(true)

        const response = await fetch(aiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
          },
          body: JSON.stringify({
            ...(aiMetadata ?? {}),
            ...(options?.body ?? {}),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to generate completion')
        }

        const text: string = await response.json()

        const meta = options?.body?.completionMetadata ?? {}
        const beforeSelection: string = meta.textBeforeCursor ?? ''
        const afterSelection: string = meta.textAfterCursor ?? ''
        const selection: string = meta.selection ?? ''

        const original = beforeSelection + selection + afterSelection
        const modified = beforeSelection + text + afterSelection

        setDiffValue({ original, modified })
        setIsDiffMode(true)
      } catch (error: any) {
        toast.error(`Failed to generate: ${error?.message ?? 'Unknown error'}`)
      } finally {
        setIsCompletionLoading(false)
      }
    },
    [aiEndpoint, aiMetadata]
  )

  const handleReset = useCallback(() => {
    setIsDiffMode(false)
    setPromptState((prev) => ({ ...prev, isOpen: false }))
    setPromptInput('')
    editorRef.current?.focus()
  }, [])

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

  const refreshCloseAction = useCallback(() => {
    closeActionDisposableRef.current?.dispose()
    closeActionDisposableRef.current = null

    const editor = editorRef.current
    const monaco = monacoRef.current

    if (!editor || !monaco || !onClose || !closeShortcutEnabled) return

    const action = editor.addAction({
      id: 'close-editor',
      label: 'Close editor',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyE],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: onClose,
    })

    closeActionDisposableRef.current = action ?? null
  }, [closeShortcutEnabled, onClose])

  const handleEditorOnMount: OnMount = (
    editor: monacoEditor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor
    monacoRef.current = monaco
    onMount?.(editor, monaco)
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

    // [Joshen] Opting to ignore "Cannot find module" errors here as users are getting
    // confused with the error highlighting when importing external modules
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [2792],
    })

    if (language === 'javascript' || language === 'typescript') {
      // The Deno libs are loaded as a raw text via raw-loader in next.config.js. They're passed as raw text to the
      // Monaco editor.
      import('public/deno/edge-runtime.d.ts' as string)
        .then((module) => {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(module.default)
        })
        .catch((error) => {
          console.error('Failed to load Deno edge-runtime typings:', error)
        })
      import('public/deno/lib.deno.d.ts' as string)
        .then((module) => {
          monaco.languages.typescript.typescriptDefaults.addExtraLib(module.default)
        })
        .catch((error) => {
          console.error('Failed to load Deno lib typings:', error)
        })
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

    refreshCloseAction()

    // Add AI Assistant toggle keybinding (Cmd+I)
    if (openAIAssistantShortcutEnabled) {
      editor.addAction({
        id: 'toggle-ai-assistant',
        label: 'Toggle AI Assistant',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyI],
        run: () => {
          toggleSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
        },
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

    if (autoFocus) {
      if (editor.getValue().length === 1) editor.setPosition({ lineNumber: 1, column: 2 })
      editor.focus()
    }
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
      const authorizationHeader = headerData.get('Authorization')

      await complete(prompt, {
        ...(authorizationHeader ? { headers: { Authorization: authorizationHeader } } : undefined),
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
            language={language}
            original={diffValue.original}
            modified={diffValue.modified}
            onMount={(editor: monacoEditor.IStandaloneDiffEditor) => {
              diffEditorRef.current = editor
              setIsDiffEditorMounted(true)
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
          {/* [Joshen] Refactor: Use CodeEditor.tsx instead, reduce duplicate declaration of Editor */}
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
