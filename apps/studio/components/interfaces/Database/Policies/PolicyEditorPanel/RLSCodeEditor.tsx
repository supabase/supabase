import { Monaco } from '@monaco-editor/react'
import { noop } from 'lodash'
import type { editor } from 'monaco-editor'
import { RefObject, useEffect } from 'react'

import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

// [Joshen] Is there a way we can just have one single MonacoEditor component that's shared across the dashboard?
// Feels like we're creating multiple copies of Editor. I'm keen to make this one the defacto as well so lets make sure
// this component does not have RLS specific logic

interface RLSCodeEditorProps {
  id: string
  defaultValue?: string
  onInputChange?: (value?: string) => void
  wrapperClassName?: string
  className?: string
  value?: string
  placeholder?: string
  readOnly?: boolean

  lineNumberStart?: number
  onChange?: () => void
  onMount?: () => void

  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  monacoRef?: RefObject<Monaco>
}

export const RLSCodeEditor = ({
  id,
  defaultValue,
  onInputChange,
  wrapperClassName,
  className,
  value,
  placeholder,
  readOnly = false,
  lineNumberStart,
  onChange = noop,
  onMount: _onMount = noop,

  editorRef,
  monacoRef,
}: RLSCodeEditorProps) => {
  const onChangeContent = (value?: string) => {
    onChange()
    onInputChange?.(value)
  }

  // when the value has changed, trigger the onChange callback so that the height of the container can be adjusted.
  // Happens when the value wordwraps and is updated via a template.
  useEffect(() => onChange(), [value])

  return (
    <CodeEditor
      id={id}
      monacoRef={monacoRef}
      editorRef={editorRef}
      isReadOnly={readOnly}
      language="pgsql"
      className={className}
      wrapperClassName={wrapperClassName}
      placeholder={placeholder}
      value={value ?? undefined}
      defaultValue={defaultValue ?? undefined}
      options={{
        lineNumbers:
          lineNumberStart !== undefined ? (num) => (num + lineNumberStart).toString() : undefined,
      }}
      actions={{ placeholderFill: { enabled: false } }}
      onMount={_onMount}
      onInputChange={onChangeContent}
    />
  )
}
