import Editor, { OnMount } from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { MutableRefObject } from 'react'
import { cn } from 'ui'

import { alignEditor } from 'components/ui/CodeEditor'

interface RLSCodeEditorProps {
  id: string
  defaultValue?: string
  onInputChange?: (value?: string) => void
  wrapperClassName?: string
  className?: string
  value?: string
  editorRef: MutableRefObject<editor.IStandaloneCodeEditor | null>
}

const RLSCodeEditor = ({
  id,
  defaultValue,
  wrapperClassName,
  className,
  value,
  editorRef,
}: RLSCodeEditorProps) => {
  const onMount: OnMount = async (editor) => {
    editorRef.current = editor
    alignEditor(editor)
    editor?.focus()
  }

  const options = {
    tabSize: 2,
    fontSize: 13,
    readOnly: false,
    minimap: { enabled: false },
    wordWrap: 'on' as const,
    fixedOverflowWidgets: true,
    contextmenu: true,
    lineNumbers: undefined,
    glyphMargin: undefined,
    lineNumbersMinChars: undefined,
    folding: undefined,
    scrollBeyondLastLine: false,
  }

  return (
    <Editor
      path={id}
      theme="supabase"
      wrapperProps={{ className: cn(wrapperClassName) }}
      className={cn(className, 'monaco-editor')}
      value={value ?? undefined}
      defaultLanguage="pgsql"
      defaultValue={defaultValue ?? undefined}
      options={options}
      onMount={onMount}
    />
  )
}

export default RLSCodeEditor
