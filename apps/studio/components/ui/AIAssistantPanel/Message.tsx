import { Message as VercelMessage } from 'ai/react'
import { User } from 'lucide-react'
import { createContext, PropsWithChildren, ReactNode, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'

import { AiIconAnimation, cn, markdownComponents, WarningIcon } from 'ui'
import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { Heading3, InlineCode, Link, ListItem, MarkdownPre, OrderedList } from './MessageMarkdown'

interface MessageContextType {
  isLoading: boolean
  readOnly?: boolean
}
export const MessageContext = createContext<MessageContextType>({ isLoading: false })

const baseMarkdownComponents: Partial<Components> = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Link,
}

interface MessageProps {
  id: string
  message: VercelMessage
  isLoading: boolean
  readOnly?: boolean
  action?: ReactNode
  variant?: 'default' | 'warning'
  onResults: ({
    messageId,
    resultId,
    results,
  }: {
    messageId: string
    resultId?: string
    results: any[]
  }) => void
}

export const Message = function Message({
  id,
  message,
  isLoading,
  readOnly,
  action = null,
  variant = 'default',
  onResults,
}: PropsWithChildren<MessageProps>) {
  const allMarkdownComponents: Partial<Components> = useMemo(
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
      pre: ({ children }) => (
        <MarkdownPre id={id} onResults={onResults}>
          {children}
        </MarkdownPre>
      ),
    }),
    [id, onResults]
  )

  if (!message) {
    console.error(`Message component received undefined message prop for id: ${id}`)
    return null
  }

  const { role, content, parts } = message
  const isUser = role === 'user'

  const shouldUsePartsRendering = parts && parts.length > 0

  const hasTextContent = content && content.trim().length > 0

  return (
    <MessageContext.Provider value={{ isLoading, readOnly }}>
      <div
        className={cn(
          'mb-5 text-foreground-light text-sm',
          isUser && 'text-foreground',
          variant === 'warning' && 'bg-warning-200'
        )}
      >
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {action}

        <div className="flex gap-4 w-auto overflow-hidden">
          {isUser ? (
            <figure className="w-5 h-5 shrink-0 bg-foreground rounded-full flex items-center justify-center">
              <User size={16} strokeWidth={1.5} className="text-background" />
            </figure>
          ) : (
            <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
          )}

          <div className="flex-1 min-w-0 space-y-4">
            {shouldUsePartsRendering ? (
              parts.map((part, index) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <ReactMarkdown
                        key={`${id}-part-${index}`}
                        className="prose prose-sm [&_h3]:text-base [&_ol>li]:pl-4 [&_ol>li]:my-0 [&_li>p]:mt-0 space-y-5 [&>*>code]:text-xs [&>*>*>code]:text-xs [&_li]:space-y-4"
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ...baseMarkdownComponents,
                          ...markdownComponents,
                          pre: 'pre',
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    )

                  case 'tool-invocation': {
                    const { toolCallId, toolName, args } = part.toolInvocation
                    switch (toolName) {
                      case 'display_query': {
                        return (
                          <DisplayBlockRenderer
                            key={`${id}-tool-${toolCallId}`}
                            messageId={id}
                            toolCallId={toolCallId}
                            manualId={args.manualToolCallId}
                            initialArgs={args}
                            messageParts={parts}
                            isLoading={isLoading}
                            onResults={onResults}
                          />
                        )
                      }
                      case 'display_edge_function': {
                        return (
                          <div
                            key={`${id}-tool-${toolCallId}`}
                            className="w-auto -ml-[36px] overflow-x-hidden"
                          >
                            <EdgeFunctionBlock
                              label={args.name || 'Edge Function'}
                              code={args.code}
                              functionName={args.name || 'my-function'}
                              showCode={!readOnly}
                            />
                          </div>
                        )
                      }
                      default:
                        return null
                    }
                  }
                  case 'reasoning':
                  case 'source':
                  case 'file':
                    return null
                  default:
                    return null
                }
              })
            ) : hasTextContent ? (
              <ReactMarkdown
                className="prose prose-sm [&_>h3]:text-base [&_ol>li]:pl-4 [&_ol>li]:my-0 space-y-5 flex-1 [&>*>code]:text-xs [&>*>*>code]:text-xs min-w-0 [&_li]:space-y-4"
                remarkPlugins={[remarkGfm]}
                components={allMarkdownComponents}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <span className="text-foreground-lighter italic">Assistant is thinking...</span>
            )}
          </div>
        </div>
      </div>
    </MessageContext.Provider>
  )
}
