import Editor, { EditorProps, Monaco, OnChange, OnMount, useMonaco } from '@monaco-editor/react'
import { merge, noop } from 'lodash'
import { Loader2 } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { RefObject, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

import { alignEditor, BASE_MONACO_EDITOR_OPTIONS } from './CodeEditor.utils'
import { Markdown } from '@/components/interfaces/Markdown'
import { useLatest } from '@/hooks/misc/useLatest'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatSql } from '@/lib/formatSql'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useIsShortcutEnabled } from '@/state/shortcuts/useIsShortcutEnabled'

type CodeEditorActions = { enabled: boolean; callback: (value: any) => void }

const DEFAULT_ACTIONS = {
  runQuery: { enabled: false, callback: noop },
  formatDocument: { enabled: true, callback: noop },
  placeholderFill: { enabled: true },
}

export type ValidLanguages =
  | 'pgsql'
  | 'json'
  | 'html'
  | 'typescript'
  | 'javascript'
  | 'css'
  | 'csv'
  | 'plaintext'
  | 'markdown'

interface CodeEditorProps {
  id?: string
  language: ValidLanguages
  autofocus?: boolean
  defaultValue?: string
  isReadOnly?: boolean
  hideLineNumbers?: boolean
  className?: string
  wrapperClassName?: string
  loading?: boolean
  options?: EditorProps['options']
  value?: string
  placeholder?: string
  /* Determines what actions to add for code editor context menu */
  actions?: Partial<{
    runQuery: CodeEditorActions
    formatDocument: CodeEditorActions
    placeholderFill: Omit<CodeEditorActions, 'callback'>
  }>
  editorRef?: RefObject<editor.IStandaloneCodeEditor | null>
  monacoRef?: RefObject<Monaco | null>
  onInputChange?: (value?: string) => void
  /**
   * Fired after CodeEditor's own mount setup runs, so wrappers can register
   * additional actions/keybindings on the shared editor instance.
   */
  onMount?: OnMount
}

export const CodeEditor = ({
  id,
  language,
  defaultValue,
  autofocus = true,
  isReadOnly = false,
  hideLineNumbers = false,
  className,
  wrapperClassName,
  loading,
  options,
  value,
  placeholder,
  actions,
  editorRef: editorRefProps,
  monacoRef: monacoRefProps,
  onInputChange = noop,
  onMount: onMountProps,
}: CodeEditorProps) => {
  const monaco = useMonaco()
  const { data: project } = useSelectedProjectQuery()

  const hasValue = useRef<editor.IContextKey<boolean>>(null)
  const ref = useRef<editor.IStandaloneCodeEditor>(null)
  const editorRef = editorRefProps || ref
  const internalMonacoRef = useRef<Monaco | null>(null)
  const monacoRef = monacoRefProps || internalMonacoRef

  const { runQuery, placeholderFill, formatDocument } = {
    ...DEFAULT_ACTIONS,
    ...actions,
  }

  // Monaco claims Cmd+K as a chord prefix, which swallows the global command menu
  // shortcut while the editor is focused. CodeEditor intercepts it for every editor
  // (see handleMount) so it behaves the same inside and outside the editor.
  const commandMenuHotkeyEnabledRef = useLatest(
    useIsShortcutEnabled(SHORTCUT_IDS.COMMAND_MENU_OPEN)
  )
  const setCommandMenuOpenRef = useLatest(useSetCommandMenuOpen())
  const runQueryCallbackRef = useLatest(runQuery.callback)

  const showPlaceholderDefault = placeholder !== undefined && (value ?? '').trim().length === 0
  const [showPlaceholder, setShowPlaceholder] = useState(showPlaceholderDefault)

  const optionsMerged = merge(
    {
      ...BASE_MONACO_EDITOR_OPTIONS,
      domReadOnly: isReadOnly,
      readOnly: isReadOnly,
      lineNumbers: hideLineNumbers ? 'off' : undefined,
      glyphMargin: hideLineNumbers ? false : undefined,
      lineNumbersMinChars: hideLineNumbers ? 0 : 4,
      folding: hideLineNumbers ? false : undefined,
    },
    options
  )

  const handleMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    alignEditor(editor)

    hasValue.current = editor.createContextKey('hasValue', false)
    hasValue.current.set(value !== undefined && value.trim().length > 0)
    setShowPlaceholder(showPlaceholderDefault)

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      if (commandMenuHotkeyEnabledRef.current) {
        setCommandMenuOpenRef.current(true)
      }
    })

    if (placeholderFill.enabled) {
      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '').split('\n\n').join('\n').replaceAll('&nbsp;', ' '),
            },
          ])
        },
        '!hasValue'
      )
    }

    if (runQuery.enabled) {
      editor.addAction({
        id: 'run-query',
        label: 'Run Query',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
        contextMenuGroupId: 'operation',
        contextMenuOrder: 0,
        run: () => {
          const selection = editorRef?.current?.getSelection()
          if (!selection) return

          const selectedValue = editorRef?.current?.getModel()?.getValueInRange(selection)
          const editorValue = editorRef?.current?.getValue()

          runQueryCallbackRef.current(selectedValue || editorValue)
        },
      })
    }

    const model = editor.getModel()
    if (model) {
      const position = model.getPositionAt((value ?? '').length)
      editor.setPosition(position)
    }

    // Run last so wrappers can register actions and have the final say on cursor
    // position / focus before CodeEditor's own (timeout-deferred) autofocus.
    onMountProps?.(editor, monaco)

    // auto focus on mount
    setTimeout(() => {
      if (autofocus) {
        if (editor.getValue().length === 1) editor.setPosition({ lineNumber: 1, column: 2 })
        editor.focus()
      }
    }, 0)
  }

  const onChangeContent: OnChange = (value) => {
    if (hasValue.current) {
      hasValue.current.set((value ?? '').length > 0)
    }
    setShowPlaceholder(!value)
    onInputChange(value)
  }

  useEffect(() => {
    setShowPlaceholder(showPlaceholderDefault)
  }, [showPlaceholderDefault])

  useEffect(() => {
    if (
      placeholderFill.enabled &&
      editorRef.current !== undefined &&
      monacoRef.current !== undefined
    ) {
      const editor = editorRef.current
      if (editor == null) return
      const monaco = monacoRef.current
      if (monaco == null) return

      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '  ')
                .split('\n\n')
                .join('\n')
                .replaceAll('*', '')
                .replaceAll('&nbsp;', ''),
            },
          ])
        },
        '!hasValue'
      )
    }
  }, [placeholder, placeholderFill.enabled])

  useEffect(() => {
    if (monaco && project && formatDocument.enabled) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model: any) {
          const value = model.getValue()
          const formatted = formatSql(value)
          formatDocument.callback(formatted)
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
      return () => formatProvider.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, project, formatDocument.enabled])

  return (
    <>
      <Editor
        path={id}
        theme="supabase"
        // `h-full` keeps this wrapper filling its container even if a global `.monaco-editor`
        // rule flips it to `position: absolute` (which happens after visiting GraphiQL, since it
        // injects a second copy of Monaco's CSS onto the shared instance). Without an explicit
        // height, an absolutely-positioned wrapper collapses to 0 and Monaco lays out at ~5px.
        // Order matters: `h-full` is a default, so a caller-supplied height in `className`
        // (e.g. `h-96`) wins via tailwind-merge instead of being clobbered.
        className={cn('monaco-editor', 'h-full', className)}
        wrapperProps={{ className: wrapperClassName }}
        value={value ?? undefined}
        language={language}
        defaultValue={defaultValue ?? undefined}
        loading={loading || <Loader2 className="animate-spin" strokeWidth={2} size={20} />}
        options={optionsMerged}
        onMount={handleMount}
        onChange={onChangeContent}
      />
      {placeholder !== undefined && (
        <div
          className={cn(
            'monaco-placeholder absolute top-[3px] left-[57px] text-sm pointer-events-none font-mono',
            '[&>div>p]:text-foreground-lighter [&>div>p]:m-0! tracking-tighter',
            showPlaceholder ? 'block' : 'hidden'
          )}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </>
  )
}
