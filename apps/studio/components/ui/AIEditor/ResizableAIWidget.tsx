import { editor as monacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef, useState } from 'react'
import InlineWidget from 'components/interfaces/SQLEditor/InlineWidget'
import { AskAIWidget } from 'components/interfaces/SQLEditor/AskAIWidget'

interface ResizableAIWidgetProps {
  editor: monacoEditor.IStandaloneCodeEditor | monacoEditor.IStandaloneDiffEditor
  id: string
  value: string
  onChange: (value: string) => void
  onSubmit: (prompt: string) => void
  onAccept?: () => void
  onReject?: () => void
  onCancel?: () => void
  isDiffVisible: boolean
  isLoading?: boolean
  startLineNumber: number
  endLineNumber: number
}

const ResizableAIWidget = ({
  editor,
  id,
  value,
  onChange,
  onSubmit,
  onAccept,
  onReject,
  onCancel,
  isDiffVisible,
  isLoading = false,
  startLineNumber,
  endLineNumber,
}: ResizableAIWidgetProps) => {
  const [widgetHeight, setWidgetHeight] = useState(0)

  return (
    <InlineWidget
      editor={editor}
      id={id}
      heightInLines={Math.max(3, Math.ceil(widgetHeight / 20))}
      afterLineNumber={endLineNumber}
      beforeLineNumber={Math.max(0, startLineNumber - 1)}
    >
      <AskAIWidget
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        onAccept={onAccept}
        onReject={onReject}
        onCancel={onCancel}
        isDiffVisible={isDiffVisible}
        isLoading={isLoading}
        onHeightChange={setWidgetHeight}
      />
    </InlineWidget>
  )
}

export default ResizableAIWidget
