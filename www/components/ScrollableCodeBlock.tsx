import rangeParser from 'parse-numeric-range'
import { useMemo } from 'react'
import CodeBlock, { CodeBlockProps } from './CodeBlock/CodeBlock'

interface ScrollableCodeBlockProps extends CodeBlockProps {
  highlightLines: string
  children: string
}

const MAX_HEIGHT = 520
const CODE_LINE_HEIGHT = 22
const TOP_OFFSET = 30

const ScrollableCodeBlock = ({
  highlightLines: highlightLinesRange,
  children,
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
    <div className="overflow-hidden" style={{ maxHeight: MAX_HEIGHT }}>
      <div
        className="transition-transform duration-500"
        style={{ transform: `translate3d(0, -${position}px, 0)` }}
      >
        <CodeBlock highlightLines={highlightLinesRange} {...props}>
          {children + '\n'.repeat(100)}
        </CodeBlock>
      </div>
    </div>
  )
}

export default ScrollableCodeBlock
