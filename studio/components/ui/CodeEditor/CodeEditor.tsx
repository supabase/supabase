import Editor, { EditorProps } from '@monaco-editor/react'
import { merge, noop } from 'lodash'
import { useRef } from 'react'

import { timeout } from 'lib/helpers'
import Connecting from '../Loading'
import { alignEditor } from './CodeEditor.utils'
import { cn } from 'ui'

interface CodeEditorProps {
  id: string
  language: 'pgsql' | 'json' | 'html'
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
}: CodeEditorProps) => {
  const editorRef = useRef()

  const onMount = async (editor: any, monaco: any) => {
    editorRef.current = editor
    alignEditor(editor)

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
      lineNumbersMinChars: hideLineNumbers ? 0 : undefined,
      folding: hideLineNumbers ? false : undefined,
    },
    options
  )

  merge({ cpp: '12' }, { java: '23' }, { python: '35' })

  return (
    <Editor
      path={id}
      theme="supabase"
      className={cn(className, 'monaco-editor')}
      value={value ?? undefined}
      defaultLanguage={language}
      defaultValue={defaultValue ?? undefined}
      loading={loading || <Connecting />}
      options={optionsMerged}
      onMount={onMount}
      onChange={onInputChange}
    />
  )
}

export default CodeEditor
