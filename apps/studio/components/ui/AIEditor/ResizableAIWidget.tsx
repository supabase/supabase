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

const LINE_HEIGHT = 20 // height of each line in pixels
const MIN_LINES = 3 // minimum number of lines to show

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [heightInLines, setHeightInLines] = useState(MIN_LINES)

  const updateHeight = useCallback(() => {
    if (containerRef.current) {
      const height = containerRef.current.offsetHeight
      const newHeightInLines = Math.max(MIN_LINES, Math.ceil(height / LINE_HEIGHT))
      setHeightInLines(newHeightInLines)
    }
  }, [])

  useEffect(() => {
    // Update height on value change
    updateHeight()

    // Set up resize observer to track height changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateHeight])

  return (
    <InlineWidget
      editor={editor}
      id={id}
      heightInLines={heightInLines}
      afterLineNumber={endLineNumber}
      beforeLineNumber={Math.max(0, startLineNumber - 1)}
    >
      <div ref={containerRef}>
        <AskAIWidget
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onAccept={onAccept}
          onReject={onReject}
          onCancel={onCancel}
          isDiffVisible={isDiffVisible}
          isLoading={isLoading}
        />
      </div>
    </InlineWidget>
  )
}

export default ResizableAIWidget
