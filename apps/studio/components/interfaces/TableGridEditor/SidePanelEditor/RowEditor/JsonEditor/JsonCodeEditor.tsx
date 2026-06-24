import { noop } from 'lodash'

import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

interface JsonCodeEditorProps {
  value: string
  readOnly?: boolean
  onInputChange: (val: string) => void
}

export const JsonCodeEditor = ({
  value = '',
  readOnly = false,
  onInputChange = noop,
}: JsonCodeEditorProps) => {
  return (
    <CodeEditor
      isReadOnly={readOnly}
      language="json"
      value={value}
      onInputChange={(val) => onInputChange(val ?? '')}
    />
  )
}
