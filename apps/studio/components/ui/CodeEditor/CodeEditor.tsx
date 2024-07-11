import Editor, { EditorProps, OnChange, OnMount } from '@monaco-editor/react'
import { merge, noop } from 'lodash'
import { editor } from 'monaco-editor'
import { useEffect, useRef } from 'react'

import { Markdown } from 'components/interfaces/Markdown'
import { timeout } from 'lib/helpers'
import { cn } from 'ui'
import { Loading } from '../Loading'
import { alignEditor } from './CodeEditor.utils'

interface CodeEditorProps {
  id: string
  language: 'pgsql' | 'json' | 'html' | undefined
  autofocus?: boolean
  defaultValue?: string
  isReadOnly?: boolean
  onInputChange?: (value?: string) => void
  onInputRun?: (value: string) => void
  hideLineNumbers?: boolean
  className?: string
  loading?: boolean
  options?: EditorProps['options']
  value?: string
  placeholder?: string
  disableTabToUsePlaceholder?: boolean
}

const CodeEditor = ({
  id,
  language,
  defaultValue,
  autofocus = true,
  isReadOnly = false,
  hideLineNumbers = false,
  onInputChange = noop,
  onInputRun = noop,
  className,
  loading,
  options,
  value,
  placeholder,
  disableTabToUsePlaceholder = false,
}: CodeEditorProps) => {
  const placeholderId = `monaco-placeholder-${id}`
  const hasValue = useRef<any>()
  const editorRef = useRef<editor.IStandaloneCodeEditor>()

  const onMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor
    alignEditor(editor)

    hasValue.current = editor.createContextKey('hasValue', false)
    const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
    if (placeholderEl && placeholder !== undefined && (value ?? '').trim().length === 0) {
      placeholderEl.style.display = 'block'
    }

    if (!disableTabToUsePlaceholder) {
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
                .replaceAll('&nbsp;', ''),
            },
          ])
        },
        '!hasValue'
      )
    }

    editor.addAction({
      id: 'supabase',
      label: 'Run Query',
      keybindings: [monaco.KeyMod.CtrlCmd + monaco.KeyCode.Enter],
      contextMenuGroupId: 'operation',
      contextMenuOrder: 0,
      run: async () => {
        const selectedValue = (editorRef?.current as any)
          .getModel()
          .getValueInRange((editorRef?.current as any)?.getSelection())
        onInputRun(selectedValue || (editorRef?.current as any)?.getValue())
      },
    })

    await timeout(500)
    if (autofocus) editor?.focus()
  }

  const onChangeContent: OnChange = (value) => {
    hasValue.current.set((value ?? '').length > 0)

    const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
    if (placeholderEl) {
      if (!value) {
        placeholderEl.style.display = 'block'
      } else {
        placeholderEl.style.display = 'none'
      }
    }

    onInputChange(value)
  }

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

  useEffect(() => {
    if (value !== undefined && value.trim().length > 0) {
      const placeholderEl = document.getElementById(placeholderId) as HTMLElement | null
      if (placeholderEl) placeholderEl.style.display = 'none'
    }
  }, [value])

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
          id={placeholderId}
          className="monaco-placeholder absolute top-[3px] left-[57px] text-sm pointer-events-none font-mono [&>div>p]:text-foreground-lighter [&>div>p]:!m-0 tracking-tighter"
          style={{ display: 'none' }}
        >
          <Markdown content={placeholder} />
        </div>
      )}
    </>
  )
}

export default CodeEditor
