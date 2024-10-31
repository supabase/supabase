import Editor, { EditorProps, Monaco, OnChange, OnMount, useMonaco } from '@monaco-editor/react'
import { merge, noop } from 'lodash'
import { editor } from 'monaco-editor'
import { MutableRefObject, useEffect, useRef, useState } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { formatQuery } from 'data/sql/format-sql-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { timeout } from 'lib/helpers'
import { cn } from 'ui'
import { Loading } from '../Loading'
import { alignEditor } from './CodeEditor.utils'

type CodeEditorActions = { enabled: boolean; callback: (value: any) => void }
const DEFAULT_ACTIONS = {
  runQuery: { enabled: false, callback: noop },
  explainCode: { enabled: false, callback: noop },
  formatDocument: { enabled: true, callback: noop },
  placeholderFill: { enabled: true },
  closeAssistant: { enabled: false, callback: noop },
}

interface CodeEditorProps {
  id: string
  language: 'pgsql' | 'json' | 'html' | undefined
  autofocus?: boolean
  defaultValue?: string
  isReadOnly?: boolean
  hideLineNumbers?: boolean
  className?: string
  loading?: boolean
  options?: EditorProps['options']
  value?: string
  placeholder?: string
  /* Determines what actions to add for code editor context menu */
  actions?: Partial<{
    runQuery: CodeEditorActions
    formatDocument: CodeEditorActions
    placeholderFill: Omit<CodeEditorActions, 'callback'>
    explainCode: CodeEditorActions
    closeAssistant: CodeEditorActions
  }>
  editorRef?: MutableRefObject<editor.IStandaloneCodeEditor | undefined>
  onInputChange?: (value?: string) => void
}

const CodeEditor = ({
  id,
  language,
  defaultValue,
  autofocus = true,
  isReadOnly = false,
  hideLineNumbers = false,
  className,
  loading,
  options,
  value,
  placeholder,
  actions = DEFAULT_ACTIONS,
  editorRef: editorRefProps,
  onInputChange = noop,
}: CodeEditorProps) => {
  const monaco = useMonaco()
  const project = useSelectedProject()

  const hasValue = useRef<any>()
  const ref = useRef<editor.IStandaloneCodeEditor>()
  const editorRef = editorRefProps || ref
  const monacoRef = useRef<Monaco>()

  const { runQuery, placeholderFill, formatDocument, explainCode, closeAssistant } = {
    ...DEFAULT_ACTIONS,
    ...actions,
  }

  const showPlaceholderDefault = placeholder !== undefined && (value ?? '').trim().length === 0
  const [showPlaceholder, setShowPlaceholder] = useState(showPlaceholderDefault)

  const optionsMerged = merge(
    {
      tabSize: 2,
      fontSize: 13,
      readOnly: isReadOnly,
      minimap: { enabled: false },
      wordWrap: 'on',
      fixedOverflowWidgets: true,
      contextmenu: true,
      lineNumbers: hideLineNumbers ? 'off' : undefined,
      glyphMargin: hideLineNumbers ? false : undefined,
      lineNumbersMinChars: hideLineNumbers ? 0 : 4,
      folding: hideLineNumbers ? false : undefined,
      scrollBeyondLastLine: false,
    },
    options
  )

  const formatPgsql = async (value: string) => {
    try {
      if (!project) throw new Error('No project')
      const formatted = await formatQuery({
        projectRef: project.ref,
        connectionString: project.connectionString,
        sql: value,
      })
      return formatted.result
    } catch (error) {
      console.error('formatPgsql error:', error)
      return value
    }
  }

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    alignEditor(editor)

    hasValue.current = editor.createContextKey('hasValue', false)
    hasValue.current.set(value !== undefined && value.trim().length > 0)
    setShowPlaceholder(showPlaceholderDefault)

    if (placeholderFill.enabled) {
      editor.addCommand(
        monaco.KeyCode.Tab,
        () => {
          editor.executeEdits('source', [
            {
              // @ts-ignore
              identifier: 'add-placeholder',
              range: new monaco.Range(1, 1, 1, 1),
              text: (placeholder ?? '')
                .split('\n\n')
                .join('\n')
                .replaceAll('*', '')
                .replaceAll('&nbsp;', ' '),
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
          const selectedValue = (editorRef?.current as any)
            .getModel()
            .getValueInRange((editorRef?.current as any)?.getSelection())
          runQuery.callback(selectedValue || (editorRef?.current as any)?.getValue())
        },
      })
    }

    if (explainCode.enabled) {
      editor.addAction({
        id: 'explain-code',
        label: 'Explain Code',
        contextMenuGroupId: 'operation',
        contextMenuOrder: 1,
        run: () => {
          const selectedValue = (editorRef?.current as any)
            .getModel()
            .getValueInRange((editorRef?.current as any)?.getSelection())
          explainCode.callback(selectedValue)
        },
      })
    }

    if (closeAssistant.enabled) {
      editor.addAction({
        id: 'close-assistant',
        label: 'Close Assistant',
        keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.KeyI],
        run: () => closeAssistant.callback(),
      })
    }

    const model = editor.getModel()
    if (model) {
      const position = model.getPositionAt((value ?? '').length)
      editor.setPosition(position)
    }

    await timeout(500)
    if (autofocus) editor?.focus()
  }

  const onChangeContent: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)
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
      const monaco = monacoRef.current

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
          const formatted = await formatPgsql(value)
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
        className={cn(className, 'monaco-editor')}
        value={value ?? undefined}
        language={language}
        defaultValue={defaultValue ?? undefined}
        loading={loading || <Loading />}
        options={optionsMerged}
        onMount={onMount}
        onChange={onChangeContent}
      />
      {placeholder !== undefined && (
        <div
          className={cn(
            'monaco-placeholder absolute top-[3px] left-[57px] text-sm pointer-events-none font-mono',
            '[&>div>p]:text-foreground-lighter [&>div>p]:!m-0 tracking-tighter',
            showPlaceholder ? 'block' : 'hidden'
          )}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </>
  )
}

export default CodeEditor
