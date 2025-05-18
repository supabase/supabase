import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import { Button, CodeBlock, CodeBlockProps, cn } from 'ui'

interface CollapsibleCodeBlockProps extends CodeBlockProps {
  onRemove?: () => void
}

const CollapsibleCodeBlock = ({ onRemove, ...props }: CollapsibleCodeBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const codeString = (props.value || props.children) as string
  const firstLine = isExpanded
    ? codeString
    : codeString?.substring(0, codeString.indexOf('\n')) || codeString

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-1 p-1 bg-surface-100 border border-default w-full overflow-hidden',
          'rounded-md'
        )}
      >
        <Button
          type="text"
          size="tiny"
          className="w-6 h-6"
          onClick={() => setIsExpanded(!isExpanded)}
          icon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        />
        <div className="flex-1 shrink-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <CodeBlock
            {...props}
            value={firstLine}
            hideCopy
            className={cn(
              'block !bg-transparent max-h-32 max-w-full !py-0 !px-0 !border-t-0 prose dark:prose-dark border-0 text-foreground !rounded-none w-full text-wrap whitespace-pre-wrap',
              // change the look of the code block. The flex hack is so that the code is wrapping since
              // every word is a separate span
              '[&>code]:m-0 [&>code>span]:flex border-t-0 [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground text-wrap whitespace-pre-wrap',
              props.className
            )}
          />
        </div>

        {onRemove && (
          <Button
            type="text"
            size="tiny"
            className="shrink-0 w-6 h-6"
            onClick={onRemove}
            icon={<X size={14} />}
          />
        )}
      </div>
    </div>
  )
}

export default CollapsibleCodeBlock
