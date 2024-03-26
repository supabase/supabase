import rangeParser from 'parse-numeric-range'
import { useMemo } from 'react'
import CodeBlock, { CodeBlockProps } from './CodeBlock/CodeBlock'

interface ScrollableCodeBlockProps extends CodeBlockProps {
  highlightLines: string
  children: string
  /**
   * Shows an application toolbar at the top
   */
  showToolbar?: boolean
}

const MAX_HEIGHT = 520
const CODE_LINE_HEIGHT = 22
const TOP_OFFSET = 4

const ScrollableCodeBlock = ({
  highlightLines: highlightLinesRange,
  children,
  showToolbar,
  ...props
}: ScrollableCodeBlockProps) => {
  const highlightLines = useMemo(
    () => rangeParser(highlightLinesRange ?? ''),
    [highlightLinesRange]
  )
  const firstLine = Math.min(...highlightLines)
  const lastLine = Math.max(...highlightLines)

  const firstLinePosition = firstLine * CODE_LINE_HEIGHT
  const lastLinePosition = lastLine * CODE_LINE_HEIGHT

  const middlePosition = (firstLinePosition + lastLinePosition) / 2
  const position = Math.max(middlePosition - MAX_HEIGHT / 2 + TOP_OFFSET, 0)

  return (
    <div>
      {showToolbar && (
        <div className="bg-surface-100 border-overlay flex h-7 w-full items-center gap-1.5 rounded-t-lg border border-b-0 px-4">
          <div className="flex items-center gap-1.5">
            <div className="bg-surface-300 h-2.5 w-2.5 rounded-full"></div>
            <div className="bg-surface-300 h-2.5 w-2.5 rounded-full"></div>
            <div className="bg-surface-300 h-2.5 w-2.5 rounded-full"></div>
          </div>
        </div>
      )}

      <div
        className="border-overlay overflow-hidden rounded-b-lg border"
        style={{ maxHeight: MAX_HEIGHT, transform: 'translateZ(0)' }}
      >
        <div
          className="transition-transform duration-500"
          style={{ transform: `translate3d(0, -${position}px, 0)` }}
        >
          {/* <CodeBlock highlightLines={highlightLinesRange} hideBorder={true} {...props}> */}
          <CodeBlock {...props}>{children + '\n'.repeat(100)}</CodeBlock>
        </div>
      </div>
    </div>
  )
}

export default ScrollableCodeBlock
