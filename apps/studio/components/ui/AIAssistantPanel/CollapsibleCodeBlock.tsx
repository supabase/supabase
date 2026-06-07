import { Code, X } from 'lucide-react'
import { Button, cn, HoverCard, HoverCardContent, HoverCardTrigger } from 'ui'
import { CodeBlock, type CodeBlockProps } from 'ui-patterns/CodeBlock'

interface CollapsibleCodeBlockProps extends CodeBlockProps {
  onRemove?: () => void
}

export const CollapsibleCodeBlock = ({ onRemove, ...props }: CollapsibleCodeBlockProps) => {
  const codeString = (props.value || props.children) as string
  const firstLine = codeString?.substring(0, codeString.indexOf('\n')) || codeString

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 bg-surface-100 border border-default w-full overflow-hidden',
          'rounded-md',
          props.className
        )}
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex flex-1 items-center gap-2 text-foreground-light px-2 hover:text-foreground cursor-pointer overflow-hidden">
              <Code size={14} strokeWidth={1.5} />
              <span className="text-xs font-mono flex-1 truncate pointer">{firstLine}...</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-96 max-h-96 overflow-auto p-0">
            <CodeBlock
              {...props}
              value={codeString}
              className={cn('text-xs font-mono border-none p-3')}
            />
          </HoverCardContent>
        </HoverCard>

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
